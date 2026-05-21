import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class CustomerService {
  constructor(private readonly db: DatabaseService) {}

  async list(tenantId: string, filters: any) {
    const { search, type, tier, city, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;
    const conditions = ['c.tenant_id = $1', 'c.is_active = true'];
    const params: any[] = [tenantId];
    let idx = 2;

    if (search) { conditions.push(`(c.first_name ILIKE $${idx} OR c.last_name ILIKE $${idx} OR c.phone ILIKE $${idx} OR c.email ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
    if (type) { conditions.push(`c.customer_type = $${idx}`); params.push(type); idx++; }
    if (tier) { conditions.push(`c.loyalty_tier = $${idx}`); params.push(tier); idx++; }
    if (city) { conditions.push(`c.city ILIKE $${idx}`); params.push(`%${city}%`); idx++; }

    const where = conditions.join(' AND ');
    const countResult = await this.db.query(`SELECT COUNT(*)::int as total FROM sales.customers c WHERE ${where}`, params);
    const result = await this.db.query(
      `SELECT c.*, COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '') as full_name
       FROM sales.customers c WHERE ${where}
       ORDER BY c.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, limit, offset]
    );

    return { data: result.rows, pagination: { total: countResult.rows[0].total, page, limit } };
  }

  async getStats(tenantId: string) {
    const result = await this.db.query(`
      SELECT
        COUNT(*)::int as total_customers,
        COUNT(*) FILTER (WHERE customer_type = 'retail')::int as retail_count,
        COUNT(*) FILTER (WHERE customer_type = 'wholesale')::int as wholesale_count,
        COUNT(*) FILTER (WHERE loyalty_tier = 'gold' OR loyalty_tier = 'platinum')::int as vip_count,
        COALESCE(SUM(total_spent), 0)::bigint as total_revenue,
        COALESCE(SUM(loyalty_points), 0)::int as total_points
      FROM sales.customers WHERE tenant_id = $1 AND is_active = true
    `, [tenantId]);
    return result.rows[0];
  }

  async getById(tenantId: string, id: string) {
    const result = await this.db.queryOne(
      'SELECT * FROM sales.customers WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    if (!result) throw new NotFoundException('Customer not found');
    return result;
  }

  async create(tenantId: string, dto: any) {
    const num = await this.db.queryOne(
      `SELECT 'CUS-' || LPAD((COUNT(*) + 1)::text, 5, '0') as next_number FROM sales.customers WHERE tenant_id = $1`,
      [tenantId]
    );
    const result = await this.db.queryOne(
      `INSERT INTO sales.customers (tenant_id, customer_number, first_name, last_name, email, phone, whatsapp, customer_type, company_name, city, governorate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [tenantId, num.next_number, dto.first_name, dto.last_name || '', dto.email || null, dto.phone || null,
       dto.whatsapp || null, dto.customer_type || 'retail', dto.company_name || null, dto.city || null, dto.governorate || null]
    );
    return result;
  }

  async update(tenantId: string, id: string, dto: any) {
    const sets: string[] = []; const params: any[] = [id, tenantId]; let idx = 3;
    for (const [key, val] of Object.entries(dto)) {
      if (['first_name','last_name','email','phone','whatsapp','customer_type','company_name','city','governorate'].includes(key)) {
        sets.push(`${key} = $${idx}`); params.push(val); idx++;
      }
    }
    if (sets.length === 0) return this.getById(tenantId, id);
    sets.push(`updated_at = NOW()`);
    const result = await this.db.queryOne(`UPDATE sales.customers SET ${sets.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`, params);
    if (!result) throw new NotFoundException('Customer not found');
    return result;
  }

  async deactivate(tenantId: string, id: string) {
    await this.db.query('UPDATE sales.customers SET is_active = false, updated_at = NOW() WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    return { success: true };
  }

  async getOrders(tenantId: string, customerId: string) {
    const result = await this.db.query(
      `SELECT so.*, (SELECT COUNT(*)::int FROM sales.order_items oi WHERE oi.order_id = so.id) as item_count
       FROM sales.sales_orders so WHERE so.tenant_id = $1 AND so.customer_id = $2
       ORDER BY so.created_at DESC LIMIT 50`,
      [tenantId, customerId]
    );
    return result.rows;
  }

  async addLoyaltyPoints(tenantId: string, customerId: string, points: number, reason: string) {
    await this.db.transaction(async (client) => {
      await client.query('UPDATE sales.customers SET loyalty_points = loyalty_points + $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3', [points, customerId, tenantId]);
      await client.query(
        `INSERT INTO crm.loyalty_transactions (tenant_id, customer_id, points, type, reason) VALUES ($1, $2, $3, $4, $5)`,
        [tenantId, customerId, points, points > 0 ? 'earn' : 'redeem', reason]
      );
      // Auto-upgrade tier
      const cust = await client.query('SELECT loyalty_points FROM sales.customers WHERE id = $1', [customerId]);
      const totalPts = cust.rows[0]?.loyalty_points || 0;
      let tier = 'bronze';
      if (totalPts >= 5000) tier = 'platinum';
      else if (totalPts >= 2000) tier = 'gold';
      else if (totalPts >= 500) tier = 'silver';
      await client.query('UPDATE sales.customers SET loyalty_tier = $1 WHERE id = $2', [tier, customerId]);
    });
    return this.getById(tenantId, customerId);
  }
}