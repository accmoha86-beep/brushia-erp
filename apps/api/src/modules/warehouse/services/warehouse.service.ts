import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class WarehouseService {
  constructor(private readonly db: DatabaseService) {}

  async list(tenantId: string) {
    const result = await this.db.query(`
      SELECT w.*,
        (SELECT COUNT(DISTINCT sl.product_id)::int FROM inventory.stock_levels sl WHERE sl.warehouse_id = w.id) as sku_count,
        (SELECT COALESCE(SUM(sl.qty_on_hand), 0)::int FROM inventory.stock_levels sl WHERE sl.warehouse_id = w.id) as total_units,
        (SELECT COALESCE(SUM(sl.qty_on_hand * sl.weighted_avg_cost), 0)::bigint FROM inventory.stock_levels sl WHERE sl.warehouse_id = w.id) as total_value
      FROM inventory.warehouses w WHERE w.tenant_id = $1 AND w.is_active = true ORDER BY w.name
    `, [tenantId]);
    return { data: result.rows };
  }

  async getById(tenantId: string, id: string) {
    const result = await this.db.queryOne(
      `SELECT w.*,
        (SELECT COUNT(DISTINCT sl.product_id)::int FROM inventory.stock_levels sl WHERE sl.warehouse_id = w.id) as sku_count,
        (SELECT COALESCE(SUM(sl.qty_on_hand), 0)::int FROM inventory.stock_levels sl WHERE sl.warehouse_id = w.id) as total_units,
        (SELECT COALESCE(SUM(sl.qty_on_hand * sl.weighted_avg_cost), 0)::bigint FROM inventory.stock_levels sl WHERE sl.warehouse_id = w.id) as total_value
      FROM inventory.warehouses w WHERE w.id = $1 AND w.tenant_id = $2`, [id, tenantId]);
    if (!result) throw new NotFoundException('Warehouse not found');
    return result;
  }

  async create(tenantId: string, dto: any) {
    const result = await this.db.queryOne(
      `INSERT INTO inventory.warehouses (tenant_id, code, name, name_ar, warehouse_type, city, governorate, phone, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) RETURNING *`,
      [tenantId, dto.code, dto.name, dto.name_ar || null, dto.warehouse_type || 'standard',
       dto.city || null, dto.governorate || null, dto.phone || null]);
    return result;
  }

  async update(tenantId: string, id: string, dto: any) {
    const sets: string[] = []; const params: any[] = [id, tenantId]; let idx = 3;
    for (const [key, val] of Object.entries(dto)) {
      if (['name','name_ar','warehouse_type','city','governorate','phone','is_active'].includes(key)) {
        sets.push(`${key} = $${idx}`); params.push(val); idx++;
      }
    }
    if (sets.length === 0) return this.getById(tenantId, id);
    sets.push('updated_at = NOW()');
    const result = await this.db.queryOne(`UPDATE inventory.warehouses SET ${sets.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`, params);
    return result;
  }

  async remove(tenantId: string, id: string) {
    // Check if warehouse has stock
    const stockCheck = await this.db.queryOne(
      `SELECT COALESCE(SUM(qty_on_hand), 0) as total_stock FROM inventory.stock_levels WHERE warehouse_id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    if (stockCheck && parseInt(stockCheck.total_stock) > 0) {
      throw new Error('Cannot delete warehouse with existing stock. Transfer or zero out inventory first.');
    }
    await this.db.query(
      `UPDATE inventory.warehouses SET is_active = false, updated_at = NOW() WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return { success: true, message: 'Branch deactivated' };
  }

  async getStock(tenantId: string, warehouseId: string) {
    const result = await this.db.query(`
      SELECT sl.*, p.name as product_name, p.name_ar as product_name_ar, p.sku
      FROM inventory.stock_levels sl
      JOIN catalog.products p ON p.id = sl.product_id
      WHERE sl.warehouse_id = $1 AND sl.tenant_id = $2
      ORDER BY p.name
    `, [warehouseId, tenantId]);
    return { data: result.rows };
  }

  async getMovements(tenantId: string, warehouseId: string) {
    const result = await this.db.query(`
      SELECT sm.*, p.name as product_name, p.name_ar as product_name_ar, p.sku
      FROM inventory.stock_movements sm
      JOIN catalog.products p ON p.id = sm.product_id
      WHERE sm.warehouse_id = $1 AND sm.tenant_id = $2
      ORDER BY sm.created_at DESC LIMIT 100
    `, [warehouseId, tenantId]);
    return { data: result.rows };
  }
}