import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class WholesaleService {
  constructor(private readonly db: DatabaseService) {}

  async listPriceLists(tenantId: string) {
    const result = await this.db.query(
      `SELECT pl.*, (SELECT COUNT(*)::int FROM catalog.price_list_items pli WHERE pli.price_list_id = pl.id) as item_count
       FROM catalog.price_lists pl WHERE pl.tenant_id = $1 ORDER BY pl.name`, [tenantId]);
    return { data: result.rows };
  }

  async getPriceList(tenantId: string, id: string) {
    const pl = await this.db.queryOne('SELECT * FROM catalog.price_lists WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (!pl) throw new NotFoundException('Price list not found');
    const items = await this.db.query(
      `SELECT pli.*, p.name as product_name, p.sku, p.base_price
       FROM catalog.price_list_items pli
       LEFT JOIN catalog.products p ON p.id = pli.product_id
       WHERE pli.price_list_id = $1 ORDER BY p.name`, [id]);
    return { ...pl, items: items.rows };
  }

  async createPriceList(tenantId: string, dto: any) {
    const result = await this.db.queryOne(
      `INSERT INTO catalog.price_lists (tenant_id, name, code, type, is_active, valid_from, valid_to, min_order_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [tenantId, dto.name, dto.code, dto.type || 'wholesale', dto.is_active !== false,
       dto.valid_from || null, dto.valid_to || null, dto.min_order_amount || 0]);
    return result;
  }

  async updatePriceList(tenantId: string, id: string, dto: any) {
    const sets: string[] = []; const params: any[] = [id, tenantId]; let idx = 3;
    for (const [key, val] of Object.entries(dto)) {
      if (['name','code','type','is_active','valid_from','valid_to','min_order_amount'].includes(key)) {
        sets.push(`${key} = $${idx}`); params.push(val); idx++;
      }
    }
    if (sets.length === 0) return this.getPriceList(tenantId, id);
    sets.push('updated_at = NOW()');
    const result = await this.db.queryOne(`UPDATE catalog.price_lists SET ${sets.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`, params);
    return result;
  }

  async addPriceListItems(tenantId: string, priceListId: string, items: any[]) {
    for (const item of items) {
      await this.db.query(
        `INSERT INTO catalog.price_list_items (price_list_id, product_id, variant_id, price, min_quantity)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
        [priceListId, item.product_id, item.variant_id || null, item.price, item.min_quantity || 1]);
    }
    return this.getPriceList(tenantId, priceListId);
  }

  async getCustomerPrices(tenantId: string, customerId: string) {
    const customer = await this.db.queryOne('SELECT customer_type FROM sales.customers WHERE id = $1 AND tenant_id = $2', [customerId, tenantId]);
    if (!customer || customer.customer_type !== 'wholesale') return { data: [] };
    const result = await this.db.query(
      `SELECT pli.*, p.name as product_name, p.sku, pl.name as price_list_name
       FROM catalog.price_list_items pli
       JOIN catalog.price_lists pl ON pl.id = pli.price_list_id
       JOIN catalog.products p ON p.id = pli.product_id
       WHERE pl.tenant_id = $1 AND pl.is_active = true
       AND (pl.valid_from IS NULL OR pl.valid_from <= NOW())
       AND (pl.valid_to IS NULL OR pl.valid_to >= NOW())
       ORDER BY p.name`, [tenantId]);
    return { data: result.rows };
  }
}