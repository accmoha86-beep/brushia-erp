import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class PurchasingService {
  constructor(private readonly db: DatabaseService) {}

  async listVendors(tenantId: string, search?: string) {
    let query = 'SELECT * FROM purchasing.vendors WHERE tenant_id = $1';
    const params: any[] = [tenantId];
    if (search) { query += ' AND (name ILIKE $2 OR contact_person ILIKE $2)'; params.push(`%${search}%`); }
    query += ' ORDER BY name ASC';
    const result = await this.db.query(query, params);
    return result.rows;
  }

  async getVendor(tenantId: string, id: string) {
    const result = await this.db.queryOne('SELECT * FROM purchasing.vendors WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (!result) throw new NotFoundException('Vendor not found');
    return result;
  }

  async createVendor(tenantId: string, dto: any) {
    const result = await this.db.queryOne(
      `INSERT INTO purchasing.vendors (tenant_id, name, contact_person, email, phone, country, city, address, payment_terms, lead_time_days, status, categories)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [tenantId, dto.name, dto.contact_person || null, dto.email || null, dto.phone || null,
       dto.country || 'CN', dto.city || null, dto.address || null, dto.payment_terms || 'net_30',
       dto.lead_time_days || 14, dto.status || 'active', dto.categories || null]
    );
    return result;
  }

  async updateVendor(tenantId: string, id: string, dto: any) {
    const sets: string[] = []; const params: any[] = [id, tenantId]; let idx = 3;
    for (const [key, val] of Object.entries(dto)) {
      if (['name','contact_person','email','phone','country','city','address','payment_terms','lead_time_days','status','categories'].includes(key)) {
        sets.push(`${key} = $${idx}`); params.push(val); idx++;
      }
    }
    if (sets.length === 0) return this.getVendor(tenantId, id);
    sets.push('updated_at = NOW()');
    const result = await this.db.queryOne(`UPDATE purchasing.vendors SET ${sets.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`, params);
    if (!result) throw new NotFoundException('Vendor not found');
    return result;
  }

  async listPOs(tenantId: string, filters: any) {
    let query = `SELECT po.*, v.name as vendor_name,
      (SELECT COALESCE(SUM(poi.quantity * poi.unit_cost), 0) FROM purchasing.purchase_order_items poi WHERE poi.purchase_order_id = po.id) as total_amount,
      (SELECT COUNT(*)::int FROM purchasing.purchase_order_items poi WHERE poi.purchase_order_id = po.id) as item_count
      FROM purchasing.purchase_orders po
      LEFT JOIN purchasing.vendors v ON v.id = po.vendor_id
      WHERE po.tenant_id = $1`;
    const params: any[] = [tenantId]; let idx = 2;
    if (filters.status) { query += ` AND po.status = $${idx}`; params.push(filters.status); idx++; }
    if (filters.vendorId) { query += ` AND po.vendor_id = $${idx}`; params.push(filters.vendorId); idx++; }
    query += ' ORDER BY po.created_at DESC';
    const result = await this.db.query(query, params);
    return { data: result.rows };
  }

  async getPO(tenantId: string, id: string) {
    const po = await this.db.queryOne(
      `SELECT po.*, v.name as vendor_name FROM purchasing.purchase_orders po
       LEFT JOIN purchasing.vendors v ON v.id = po.vendor_id
       WHERE po.id = $1 AND po.tenant_id = $2`, [id, tenantId]);
    if (!po) throw new NotFoundException('Purchase order not found');
    const items = await this.db.query(
      `SELECT poi.*, p.name as product_name, p.sku FROM purchasing.purchase_order_items poi
       LEFT JOIN catalog.products p ON p.id = poi.product_id
       WHERE poi.purchase_order_id = $1`, [id]);
    return { ...po, items: items.rows };
  }

  async createPO(tenantId: string, userId: string, dto: any) {
    return this.db.transaction(async (client) => {
      const num = await client.query(
        `SELECT 'PO-' || LPAD((COUNT(*) + 1)::text, 5, '0') as next FROM purchasing.purchase_orders WHERE tenant_id = $1`, [tenantId]);
      const po = await client.query(
        `INSERT INTO purchasing.purchase_orders (tenant_id, po_number, vendor_id, status, expected_date, shipping_cost, customs_duty, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [tenantId, num.rows[0].next, dto.vendor_id, 'draft', dto.expected_date || null,
         dto.shipping_cost || 0, dto.customs_duty || 0, dto.notes || null, userId]);
      const poId = po.rows[0].id;
      for (const item of (dto.items || [])) {
        await client.query(
          `INSERT INTO purchasing.purchase_order_items (purchase_order_id, product_id, variant_id, quantity, unit_cost)
           VALUES ($1, $2, $3, $4, $5)`,
          [poId, item.product_id, item.variant_id || null, item.quantity, item.unit_cost]);
      }
      return po.rows[0];
    });
  }

  async updatePOStatus(tenantId: string, id: string, status: string) {
    const result = await this.db.queryOne(
      `UPDATE purchasing.purchase_orders SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [status, id, tenantId]);
    if (!result) throw new NotFoundException('PO not found');
    return result;
  }

  async receivePO(tenantId: string, userId: string, id: string, dto: any) {
    return this.db.transaction(async (client) => {
      const po = await client.query('SELECT * FROM purchasing.purchase_orders WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
      if (!po.rows[0]) throw new NotFoundException('PO not found');
      for (const item of (dto.items || [])) {
        await client.query(
          `UPDATE purchasing.purchase_order_items SET received_qty = COALESCE(received_qty, 0) + $1 WHERE id = $2`,
          [item.received_qty, item.item_id]);
        // Update stock levels
        const warehouse_id = dto.warehouse_id;
        await client.query(
          `INSERT INTO inventory.stock_levels (tenant_id, product_id, variant_id, warehouse_id, qty_on_hand)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (tenant_id, product_id, variant_id, warehouse_id)
           DO UPDATE SET qty_on_hand = inventory.stock_levels.qty_on_hand + $5, updated_at = NOW()`,
          [tenantId, item.product_id, item.variant_id || null, warehouse_id, item.received_qty]);
      }
      await client.query("UPDATE purchasing.purchase_orders SET status = 'received', updated_at = NOW() WHERE id = $1", [id]);
      return { success: true, po_id: id };
    });
  }

  async getStats(tenantId: string) {
    const result = await this.db.queryOne(`
      SELECT
        COUNT(*)::int as total_pos,
        COUNT(*) FILTER (WHERE status = 'draft')::int as draft_count,
        COUNT(*) FILTER (WHERE status = 'sent')::int as pending_count,
        COUNT(*) FILTER (WHERE status = 'received')::int as received_count,
        (SELECT COUNT(*)::int FROM purchasing.vendors WHERE tenant_id = $1) as vendor_count
      FROM purchasing.purchase_orders WHERE tenant_id = $1
    `, [tenantId]);
    return result;
  }
}