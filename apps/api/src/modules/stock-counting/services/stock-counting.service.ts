import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class StockCountingService {
  constructor(private readonly db: DatabaseService) {}

  async list(tenantId: string, filters: any) {
    const { warehouseId, status, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;
    const conditions = ['sc.tenant_id = $1'];
    const params: any[] = [tenantId];
    let idx = 2;

    if (warehouseId) { conditions.push(`sc.warehouse_id = $${idx}`); params.push(warehouseId); idx++; }
    if (status) { conditions.push(`sc.status = $${idx}`); params.push(status); idx++; }

    const where = conditions.join(' AND ');
    const countResult = await this.db.query(
      `SELECT COUNT(*)::int as total FROM inventory.stock_counts sc WHERE ${where}`, params,
    );
    const result = await this.db.query(
      `SELECT sc.*, w.name as warehouse_name
       FROM inventory.stock_counts sc
       LEFT JOIN inventory.warehouses w ON w.id = sc.warehouse_id
       WHERE ${where}
       ORDER BY sc.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset],
    );

    return { data: result.rows, pagination: { total: countResult.rows[0].total, page, limit } };
  }

  async getById(tenantId: string, id: string) {
    const count = await this.db.queryOne(
      `SELECT sc.*, w.name as warehouse_name
       FROM inventory.stock_counts sc
       LEFT JOIN inventory.warehouses w ON w.id = sc.warehouse_id
       WHERE sc.id = $1 AND sc.tenant_id = $2`,
      [id, tenantId],
    );
    if (!count) throw new NotFoundException('Stock count not found');

    const items = await this.db.query(
      `SELECT sci.*, p.name as product_name, p.sku
       FROM inventory.stock_count_items sci
       LEFT JOIN catalog.products p ON p.id = sci.product_id
       WHERE sci.stock_count_id = $1 AND sci.tenant_id = $2
       ORDER BY p.name ASC`,
      [id, tenantId],
    );

    return { ...count, items: items.rows };
  }

  async create(tenantId: string, userId: string, dto: any) {
    const { warehouse_id, count_type, notes } = dto;
    if (!warehouse_id) throw new BadRequestException('warehouse_id is required');

    // Generate count number: SC-YYYYMMDD-NNN
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seqResult = await this.db.queryOne(
      `SELECT COUNT(*)::int + 1 as seq FROM inventory.stock_counts
       WHERE tenant_id = $1 AND count_number LIKE $2`,
      [tenantId, `SC-${today}-%`],
    );
    const countNumber = `SC-${today}-${String(seqResult.seq).padStart(3, '0')}`;

    // Create stock count
    const count = await this.db.queryOne(
      `INSERT INTO inventory.stock_counts (tenant_id, count_number, warehouse_id, count_type, status, counted_by, count_date, notes)
       VALUES ($1, $2, $3, $4, 'draft', $5, NOW(), $6) RETURNING *`,
      [tenantId, countNumber, warehouse_id, count_type || 'full', userId, notes || null],
    );

    // Auto-populate items from stock_levels
    await this.db.query(
      `INSERT INTO inventory.stock_count_items (tenant_id, stock_count_id, product_id, variant_id, system_qty, unit_cost)
       SELECT sl.tenant_id, $2, sl.product_id, sl.variant_id, sl.qty_on_hand,
         COALESCE((SELECT pv.cost_price FROM catalog.product_variants pv WHERE pv.id = sl.variant_id), 0)
       FROM inventory.stock_levels sl
       WHERE sl.tenant_id = $1 AND sl.warehouse_id = $3`,
      [tenantId, count.id, warehouse_id],
    );

    // Update total items count
    const itemCount = await this.db.queryOne(
      `SELECT COUNT(*)::int as total FROM inventory.stock_count_items WHERE stock_count_id = $1`,
      [count.id],
    );
    await this.db.query(
      `UPDATE inventory.stock_counts SET total_items = $1 WHERE id = $2`,
      [itemCount.total, count.id],
    );

    return this.getById(tenantId, count.id);
  }

  async updateItems(tenantId: string, countId: string, items: Array<{ id: string; counted_qty: number }>) {
    // Verify the count exists and is in draft status
    const count = await this.db.queryOne(
      `SELECT * FROM inventory.stock_counts WHERE id = $1 AND tenant_id = $2`,
      [countId, tenantId],
    );
    if (!count) throw new NotFoundException('Stock count not found');
    if (count.status !== 'draft' && count.status !== 'in_progress') {
      throw new BadRequestException('Can only update items for draft or in-progress counts');
    }

    // Update status to in_progress
    if (count.status === 'draft') {
      await this.db.query(
        `UPDATE inventory.stock_counts SET status = 'in_progress', updated_at = NOW() WHERE id = $1`,
        [countId],
      );
    }

    // Update each item
    for (const item of items) {
      await this.db.query(
        `UPDATE inventory.stock_count_items SET counted_qty = $1 WHERE id = $2 AND tenant_id = $3 AND stock_count_id = $4`,
        [item.counted_qty, item.id, tenantId, countId],
      );
    }

    return this.getById(tenantId, countId);
  }

  async complete(tenantId: string, countId: string, approvedBy: string) {
    const count = await this.db.queryOne(
      `SELECT * FROM inventory.stock_counts WHERE id = $1 AND tenant_id = $2`,
      [countId, tenantId],
    );
    if (!count) throw new NotFoundException('Stock count not found');
    if (count.status === 'completed' || count.status === 'cancelled') {
      throw new BadRequestException('Count is already completed or cancelled');
    }

    // Get items with variances
    const items = await this.db.query(
      `SELECT * FROM inventory.stock_count_items WHERE stock_count_id = $1 AND tenant_id = $2`,
      [countId, tenantId],
    );

    // Update stock levels with new quantities
    let totalVariance = 0;
    let varianceValue = 0;
    for (const item of items.rows) {
      if (item.counted_qty != null) {
        const variance = item.counted_qty - item.system_qty;
        totalVariance += Math.abs(variance);
        varianceValue += Math.abs(variance) * (item.unit_cost || 0);

        // Update stock level
        await this.db.query(
          `UPDATE inventory.stock_levels SET qty_on_hand = $1, updated_at = NOW()
           WHERE tenant_id = $2 AND product_id = $3 AND variant_id = $4 AND warehouse_id = $5`,
          [item.counted_qty, tenantId, item.product_id, item.variant_id, count.warehouse_id],
        );
      }
    }

    // Complete the count
    await this.db.query(
      `UPDATE inventory.stock_counts
       SET status = 'completed', approved_by = $3, completed_at = NOW(), updated_at = NOW(),
           total_variance = $4, variance_value = $5
       WHERE id = $1 AND tenant_id = $2`,
      [countId, tenantId, approvedBy, totalVariance, varianceValue],
    );

    return this.getById(tenantId, countId);
  }

  async cancel(tenantId: string, countId: string) {
    const result = await this.db.queryOne(
      `UPDATE inventory.stock_counts SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2 AND status != 'completed' RETURNING *`,
      [countId, tenantId],
    );
    if (!result) throw new NotFoundException('Stock count not found or already completed');
    return result;
  }
}
