import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class ShippingService {
  constructor(private readonly db: DatabaseService) {}

  async list(tenantId: string, status?: string) {
    let query = `SELECT s.*, so.order_number FROM shipping.shipments s
      LEFT JOIN sales.sales_orders so ON so.id = s.order_id
      WHERE s.tenant_id = $1`;
    const params: any[] = [tenantId];
    if (status) { query += ' AND s.status = $2'; params.push(status); }
    query += ' ORDER BY s.created_at DESC';
    const result = await this.db.query(query, params);
    return { data: result.rows };
  }

  async getById(tenantId: string, id: string) {
    const result = await this.db.queryOne(
      `SELECT s.*, so.order_number FROM shipping.shipments s
       LEFT JOIN sales.sales_orders so ON so.id = s.order_id
       WHERE s.id = $1 AND s.tenant_id = $2`, [id, tenantId]);
    if (!result) throw new NotFoundException('Shipment not found');
    return result;
  }

  async create(tenantId: string, userId: string, dto: any) {
    const trackingNum = 'BST-' + Date.now().toString().slice(-8);
    const result = await this.db.queryOne(
      `INSERT INTO shipping.shipments (tenant_id, order_id, carrier, tracking_number, status, recipient_name, recipient_phone, city, governorate, address, cod_amount, weight_grams, notes, created_by)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [tenantId, dto.order_id, dto.carrier || 'bosta', trackingNum,
       dto.recipient_name, dto.recipient_phone, dto.city, dto.governorate || null, dto.address,
       dto.cod_amount || 0, dto.weight_grams || 0, dto.notes || null, userId]);
    return result;
  }

  async updateStatus(tenantId: string, id: string, dto: any) {
    const sets = ['status = $1', 'updated_at = NOW()']; const params: any[] = [dto.status, id, tenantId];
    if (dto.tracking_number) { sets.push('tracking_number = $4'); params.push(dto.tracking_number); }
    const result = await this.db.queryOne(
      `UPDATE shipping.shipments SET ${sets.join(', ')} WHERE id = $2 AND tenant_id = $3 RETURNING *`, params);
    if (!result) throw new NotFoundException('Shipment not found');
    return result;
  }

  async getStats(tenantId: string) {
    const result = await this.db.queryOne(`
      SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'pending')::int as pending,
        COUNT(*) FILTER (WHERE status = 'picked_up')::int as picked_up,
        COUNT(*) FILTER (WHERE status = 'in_transit')::int as in_transit,
        COUNT(*) FILTER (WHERE status = 'delivered')::int as delivered,
        COUNT(*) FILTER (WHERE status = 'failed')::int as failed
      FROM shipping.shipments WHERE tenant_id = $1`, [tenantId]);
    return result;
  }
}