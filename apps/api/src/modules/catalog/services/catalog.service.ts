import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { AuditService } from '../../audit/audit.service';
import { TCreateCategory, TUpdateCategory, TCreateProduct, TUpdateProduct, TProductQuery, TCreateVariant, TUpdateVariant } from '../dto/catalog.dto';
import { ICatalogService } from '@brushia/shared';

@Injectable()
export class CatalogService implements ICatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
  ) {}

  // ═══════════════════════════════════════════════════════
  // CATEGORIES
  // ═══════════════════════════════════════════════════════

  async createCategory(tenantId: string, userId: string, dto: TCreateCategory) {
    const result = await this.db.query(
      `INSERT INTO catalog.categories (tenant_id, name, name_ar, slug, parent_id, sort_order, image_url, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [tenantId, dto.name, dto.name_ar, dto.slug, dto.parent_id, dto.sort_order, dto.image_url, dto.is_active],
    );
    
    await this.audit.log({
      tenantId, userId,
      action: 'category.created',
      entity_type: 'category',
      entity_id: result.rows[0].id,
      new_values: dto,
    });

    this.logger.log(`Category created: ${dto.name} [tenant=${tenantId}]`);
    return result.rows[0];
  }

  async listCategories(tenantId: string, filters: { parent_id?: string; is_active?: string; search?: string }) {
    let query = `SELECT c.*, 
      (SELECT COUNT(*) FROM catalog.categories sc WHERE sc.parent_id = c.id AND sc.tenant_id = $1) as child_count,
      (SELECT COUNT(*) FROM catalog.products p WHERE p.category_id = c.id AND p.tenant_id = $1 AND p.parent_id IS NULL) as product_count
      FROM catalog.categories c WHERE c.tenant_id = $1`;
    const params: any[] = [tenantId];
    let idx = 2;

    if (filters.parent_id) {
      query += ` AND c.parent_id = $${idx++}`;
      params.push(filters.parent_id);
    } else if (!filters.search) {
      query += ` AND c.parent_id IS NULL`; // Root categories by default
    }

    if (filters.is_active !== undefined) {
      query += ` AND c.is_active = $${idx++}`;
      params.push(filters.is_active === 'true');
    }

    if (filters.search) {
      query += ` AND (c.name ILIKE $${idx} OR c.name_ar ILIKE $${idx})`;
      params.push(`%${filters.search}%`);
      idx++;
    }

    query += ` ORDER BY c.sort_order ASC, c.name ASC`;
    
    const result = await this.db.query(query, params);
    return result.rows;
  }

  async getCategoryTree(tenantId: string) {
    const result = await this.db.query(
      `WITH RECURSIVE cat_tree AS (
        SELECT c.*, 0 as depth, ARRAY[c.sort_order::text, c.id::text] as path
        FROM catalog.categories c
        WHERE c.tenant_id = $1 AND c.parent_id IS NULL
        UNION ALL
        SELECT c.*, ct.depth + 1, ct.path || ARRAY[c.sort_order::text, c.id::text]
        FROM catalog.categories c
        INNER JOIN cat_tree ct ON c.parent_id = ct.id
        WHERE c.tenant_id = $1
      )
      SELECT * FROM cat_tree ORDER BY path`,
      [tenantId],
    );
    return this.nestCategories(result.rows);
  }

  private nestCategories(flat: any[]): any[] {
    const map = new Map<string, any>();
    const roots: any[] = [];

    for (const cat of flat) {
      map.set(cat.id, { ...cat, children: [] });
    }

    for (const cat of flat) {
      const node = map.get(cat.id)!;
      if (cat.parent_id && map.has(cat.parent_id)) {
        map.get(cat.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async updateCategory(tenantId: string, userId: string, categoryId: string, dto: TUpdateCategory) {
    const existing = await this.db.queryOne(
      `SELECT * FROM catalog.categories WHERE id = $1 AND tenant_id = $2`,
      [categoryId, tenantId],
    );
    if (!existing) throw new NotFoundException('Category not found');

    const setClauses: string[] = [];
    const params: any[] = [categoryId, tenantId];
    let idx = 3;

    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        setClauses.push(`${key} = $${idx++}`);
        params.push(value);
      }
    }

    if (setClauses.length === 0) return existing;

    setClauses.push(`updated_at = NOW()`);
    const result = await this.db.query(
      `UPDATE catalog.categories SET ${setClauses.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      params,
    );

    await this.audit.log({
      tenantId, userId,
      action: 'category.updated',
      entity_type: 'category',
      entity_id: categoryId,
      old_values: existing,
      new_values: dto,
    });

    return result.rows[0];
  }

  async deleteCategory(tenantId: string, userId: string, categoryId: string) {
    const existing = await this.db.queryOne(
      `SELECT * FROM catalog.categories WHERE id = $1 AND tenant_id = $2`,
      [categoryId, tenantId],
    );
    if (!existing) throw new NotFoundException('Category not found');

    // Check for children or products
    const children = await this.db.queryOne(
      `SELECT COUNT(*) as count FROM catalog.categories WHERE parent_id = $1 AND tenant_id = $2`,
      [categoryId, tenantId],
    );
    if (parseInt(children.count) > 0) {
      throw new ConflictException('Cannot delete category with subcategories');
    }

    const products = await this.db.queryOne(
      `SELECT COUNT(*) as count FROM catalog.products WHERE category_id = $1 AND tenant_id = $2`,
      [categoryId, tenantId],
    );
    if (parseInt(products.count) > 0) {
      throw new ConflictException('Cannot delete category with products. Move products first.');
    }

    await this.db.query(
      `DELETE FROM catalog.categories WHERE id = $1 AND tenant_id = $2`,
      [categoryId, tenantId],
    );

    await this.audit.log({
      tenantId, userId,
      action: 'category.deleted',
      entity_type: 'category',
      entity_id: categoryId,
      old_values: existing,
    });
  }

  // ═══════════════════════════════════════════════════════
  // PRODUCTS
  // ═══════════════════════════════════════════════════════

  async createProduct(tenantId: string, userId: string, dto: TCreateProduct) {
    // Check SKU uniqueness
    const existingSku = await this.db.queryOne(
      `SELECT id FROM catalog.products WHERE sku = $1 AND tenant_id = $2`,
      [dto.sku, tenantId],
    );
    if (existingSku) throw new ConflictException(`SKU "${dto.sku}" already exists`);

    // Validate category exists
    const category = await this.db.queryOne(
      `SELECT id FROM catalog.categories WHERE id = $1 AND tenant_id = $2`,
      [dto.category_id, tenantId],
    );
    if (!category) throw new NotFoundException('Category not found');

    const result = await this.db.query(
      `INSERT INTO catalog.products (
        tenant_id, name, name_ar, slug, sku, barcode, category_id, brand_id,
        description, description_ar, cost_price, selling_price, compare_at_price,
        product_type, weight_grams, tax_rate, is_taxable, is_active, image_url, tags
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      RETURNING *`,
      [
        tenantId, dto.name, dto.name_ar, dto.slug, dto.sku, dto.barcode, dto.category_id, dto.brand_id,
        dto.description, dto.description_ar, dto.cost_price, dto.selling_price, dto.compare_at_price,
        dto.product_type, dto.weight_grams, dto.tax_rate, dto.is_taxable, dto.is_active, dto.image_url,
        dto.tags ? JSON.stringify(dto.tags) : null,
      ],
    );

    await this.audit.log({
      tenantId, userId,
      action: 'product.created',
      entity_type: 'product',
      entity_id: result.rows[0].id,
      new_values: { name: dto.name, sku: dto.sku },
    });

    this.logger.log(`Product created: ${dto.sku} - ${dto.name} [tenant=${tenantId}]`);
    return result.rows[0];
  }

  async listProducts(tenantId: string, query: TProductQuery) {
    const page = parseInt(query.page);
    const limit = Math.min(parseInt(query.limit), 100);
    const offset = (page - 1) * limit;

    let sql = `SELECT p.*, c.name as category_name,
      (SELECT COUNT(*) FROM catalog.product_variants v WHERE v.product_id = p.id AND v.tenant_id = $1) as variant_count,
      COALESCE(
        (SELECT SUM(sl.qty_on_hand) FROM inventory.stock_levels sl WHERE sl.product_id = p.id AND sl.tenant_id = $1), 0
      ) as total_stock
      FROM catalog.products p
      LEFT JOIN catalog.categories c ON c.id = p.category_id
      WHERE p.tenant_id = $1 AND p.parent_id IS NULL`;
    
    let countSql = `SELECT COUNT(*) as total FROM catalog.products p WHERE p.tenant_id = $1 AND p.parent_id IS NULL`;
    
    const params: any[] = [tenantId];
    const countParams: any[] = [tenantId];
    let idx = 2;
    let cidx = 2;

    if (query.category_id) {
      sql += ` AND p.category_id = $${idx++}`;
      countSql += ` AND p.category_id = $${cidx++}`;
      params.push(query.category_id);
      countParams.push(query.category_id);
    }

    if (query.brand) {
      sql += ` AND p.brand = $${idx++}`;
      countSql += ` AND p.brand = $${cidx++}`;
      params.push(query.brand);
      countParams.push(query.brand);
    }

    if (query.product_type) {
      sql += ` AND p.product_type = $${idx++}`;
      countSql += ` AND p.product_type = $${cidx++}`;
      params.push(query.product_type);
      countParams.push(query.product_type);
    }

    if (query.is_active !== undefined) {
      sql += ` AND p.is_active = $${idx++}`;
      countSql += ` AND p.is_active = $${cidx++}`;
      const val = query.is_active === 'true';
      params.push(val);
      countParams.push(val);
    }

    if (query.min_price) {
      sql += ` AND p.selling_price >= $${idx++}`;
      countSql += ` AND p.selling_price >= $${cidx++}`;
      params.push(parseInt(query.min_price));
      countParams.push(parseInt(query.min_price));
    }

    if (query.max_price) {
      sql += ` AND p.selling_price <= $${idx++}`;
      countSql += ` AND p.selling_price <= $${cidx++}`;
      params.push(parseInt(query.max_price));
      countParams.push(parseInt(query.max_price));
    }

    if (query.search) {
      sql += ` AND (p.name ILIKE $${idx} OR p.sku ILIKE $${idx} OR p.barcode = $${idx + 1})`;
      countSql += ` AND (p.name ILIKE $${cidx} OR p.sku ILIKE $${cidx} OR p.barcode = $${cidx + 1})`;
      params.push(`%${query.search}%`, query.search);
      countParams.push(`%${query.search}%`, query.search);
      idx += 2;
      cidx += 2;
    }

    // Sort
    const sortMap: Record<string, string> = {
      name: 'p.name',
      sku: 'p.sku',
      selling_price: 'p.selling_price',
      created_at: 'p.created_at',
    };
    const sortCol = sortMap[query.sort_by] || 'p.name';
    const sortDir = query.sort_order === 'desc' ? 'DESC' : 'ASC';
    sql += ` ORDER BY ${sortCol} ${sortDir}`;
    sql += ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const [dataResult, countResult] = await Promise.all([
      this.db.query(sql, params),
      this.db.query(countSql, countParams),
    ]);

    const total = parseInt(countResult.rows[0].total);

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  async getProduct(tenantId: string, productId: string) {
    const product = await this.db.queryOne(
      `SELECT p.*, c.name as category_name
       FROM catalog.products p
       LEFT JOIN catalog.categories c ON c.id = p.category_id
       WHERE p.id = $1 AND p.tenant_id = $2`,
      [productId, tenantId],
    );
    if (!product) throw new NotFoundException('Product not found');

    // Fetch variants if variable product
    if (product.product_type === 'variable') {
      const variants = await this.db.query(
        `SELECT v.*, 
          COALESCE((SELECT SUM(sl.qty_on_hand) FROM inventory.stock_levels sl WHERE sl.variant_id = v.id AND sl.tenant_id = $2), 0) as total_stock
         FROM catalog.product_variants v 
         WHERE v.product_id = $1 AND v.tenant_id = $2 
         ORDER BY v.sort_order ASC, v.name ASC`,
        [productId, tenantId],
      );
      product.variants = variants.rows;
    }

    // Fetch images
    const images = await this.db.query(
      `SELECT * FROM catalog.product_images WHERE product_id = $1 AND tenant_id = $2 ORDER BY sort_order ASC`,
      [productId, tenantId],
    );
    product.images = images.rows;

    return product;
  }

  async getProductBySku(tenantId: string, sku: string) {
    const product = await this.db.queryOne(
      `SELECT p.*, c.name as category_name
       FROM catalog.products p
       LEFT JOIN catalog.categories c ON c.id = p.category_id
       WHERE p.sku = $1 AND p.tenant_id = $2`,
      [sku, tenantId],
    );
    if (!product) throw new NotFoundException(`Product with SKU "${sku}" not found`);
    return product;
  }

  async resolveBarcode(tenantId: string, barcode: string) {
    // Check products first
    let item = await this.db.queryOne(
      `SELECT p.id, p.name, p.sku, p.selling_price, p.cost_price, p.tax_rate, p.is_taxable, p.image_url,
        'product' as item_type, NULL as variant_id
       FROM catalog.products p 
       WHERE p.barcode = $1 AND p.tenant_id = $2 AND p.is_active = true`,
      [barcode, tenantId],
    );

    if (!item) {
      // Check variants
      item = await this.db.queryOne(
        `SELECT p.id as product_id, p.name as product_name, v.id, v.name, v.sku,
          COALESCE(v.selling_price, p.selling_price) as selling_price,
          COALESCE(v.cost_price, p.cost_price) as cost_price,
          p.tax_rate, p.is_taxable,
          COALESCE(v.image_url, p.image_url) as image_url,
          'variant' as item_type, v.id as variant_id
         FROM catalog.product_variants v
         INNER JOIN catalog.products p ON p.id = v.product_id
         WHERE v.barcode = $1 AND v.tenant_id = $2 AND v.is_active = true`,
        [barcode, tenantId],
      );
    }

    // Check additional barcodes table
    if (!item) {
      item = await this.db.queryOne(
        `SELECT pb.product_id, pb.variant_id, p.name, p.sku, p.selling_price, p.cost_price, p.tax_rate, p.is_taxable, p.image_url,
          CASE WHEN pb.variant_id IS NOT NULL THEN 'variant' ELSE 'product' END as item_type
         FROM catalog.product_barcodes pb
         INNER JOIN catalog.products p ON p.id = pb.product_id
         WHERE pb.barcode = $1 AND pb.tenant_id = $2`,
        [barcode, tenantId],
      );
    }

    if (!item) throw new NotFoundException(`No product found for barcode "${barcode}"`);
    return item;
  }

  async updateProduct(tenantId: string, userId: string, productId: string, dto: TUpdateProduct) {
    const existing = await this.db.queryOne(
      `SELECT * FROM catalog.products WHERE id = $1 AND tenant_id = $2`,
      [productId, tenantId],
    );
    if (!existing) throw new NotFoundException('Product not found');

    // Check SKU uniqueness if changing
    if (dto.sku && dto.sku !== existing.sku) {
      const skuExists = await this.db.queryOne(
        `SELECT id FROM catalog.products WHERE sku = $1 AND tenant_id = $2 AND id != $3`,
        [dto.sku, tenantId, productId],
      );
      if (skuExists) throw new ConflictException(`SKU "${dto.sku}" already exists`);
    }

    const setClauses: string[] = [];
    const params: any[] = [productId, tenantId];
    let idx = 3;

    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        if (key === 'tags') {
          setClauses.push(`${key} = $${idx++}`);
          params.push(JSON.stringify(value));
        } else {
          setClauses.push(`${key} = $${idx++}`);
          params.push(value);
        }
      }
    }

    if (setClauses.length === 0) return existing;

    setClauses.push(`updated_at = NOW()`);
    const result = await this.db.query(
      `UPDATE catalog.products SET ${setClauses.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      params,
    );

    await this.audit.log({
      tenantId, userId,
      action: 'product.updated',
      entity_type: 'product',
      entity_id: productId,
      old_values: { name: existing.name, sku: existing.sku, selling_price: existing.selling_price },
      new_values: dto,
    });

    return result.rows[0];
  }

  async deleteProduct(tenantId: string, userId: string, productId: string) {
    const existing = await this.db.queryOne(
      `SELECT * FROM catalog.products WHERE id = $1 AND tenant_id = $2`,
      [productId, tenantId],
    );
    if (!existing) throw new NotFoundException('Product not found');

    // Soft delete — mark inactive, keep for history
    await this.db.query(
      `UPDATE catalog.products SET is_active = false, updated_at = NOW() WHERE id = $1 AND tenant_id = $2`,
      [productId, tenantId],
    );

    await this.audit.log({
      tenantId, userId,
      action: 'product.deactivated',
      entity_type: 'product',
      entity_id: productId,
      old_values: { name: existing.name, sku: existing.sku },
    });
  }

  // ═══════════════════════════════════════════════════════
  // VARIANTS
  // ═══════════════════════════════════════════════════════

  async createVariant(tenantId: string, userId: string, dto: TCreateVariant) {
    // Verify parent product exists and is variable
    const product = await this.db.queryOne(
      `SELECT * FROM catalog.products WHERE id = $1 AND tenant_id = $2`,
      [dto.product_id, tenantId],
    );
    if (!product) throw new NotFoundException('Parent product not found');
    if (product.product_type !== 'variable') {
      throw new ConflictException('Cannot add variants to a simple product');
    }

    // Check SKU uniqueness
    const existingSku = await this.db.queryOne(
      `SELECT id FROM catalog.product_variants WHERE sku = $1 AND tenant_id = $2
       UNION ALL
       SELECT id FROM catalog.products WHERE sku = $1 AND tenant_id = $2`,
      [dto.sku, tenantId],
    );
    if (existingSku) throw new ConflictException(`SKU "${dto.sku}" already exists`);

    const result = await this.db.query(
      `INSERT INTO catalog.product_variants (
        tenant_id, product_id, sku, barcode, name,
        option1_name, option1_value, option2_name, option2_value,
        cost_price, selling_price, weight_grams, image_url, is_active, sort_order
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      [
        tenantId, dto.product_id, dto.sku, dto.barcode, dto.name,
        dto.option1_name, dto.option1_value, dto.option2_name, dto.option2_value,
        dto.cost_price, dto.selling_price, dto.weight_grams, dto.image_url, dto.is_active, dto.sort_order,
      ],
    );

    await this.audit.log({
      tenantId, userId,
      action: 'variant.created',
      entity_type: 'variant',
      entity_id: result.rows[0].id,
      new_values: { product: product.name, variant: dto.name, sku: dto.sku },
    });

    return result.rows[0];
  }

  async searchProducts(tenantId: string, searchTerm: string, limit = 20) {
    const result = await this.db.query(
      `SELECT p.id, p.name, p.sku, p.barcode, p.selling_price, p.cost_price, p.image_url, p.product_type,
        c.name as category_name,
        COALESCE(
          (SELECT SUM(sl.qty_on_hand) FROM inventory.stock_levels sl WHERE sl.product_id = p.id AND sl.tenant_id = $1), 0
        ) as total_stock
       FROM catalog.products p
       LEFT JOIN catalog.categories c ON c.id = p.category_id
       WHERE p.tenant_id = $1 AND p.is_active = true AND p.parent_id IS NULL
         AND (
           p.name ILIKE $2 OR p.sku ILIKE $2 OR p.barcode = $3
           OR p.search_vector @@ plainto_tsquery('english', $3)
         )
       ORDER BY 
         CASE WHEN p.sku = $3 THEN 0 WHEN p.barcode = $3 THEN 1 ELSE 2 END,
         p.name ASC
       LIMIT $4`,
      [tenantId, `%${searchTerm}%`, searchTerm, limit],
    );
    return result.rows;
  }
}