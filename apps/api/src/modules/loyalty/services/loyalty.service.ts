import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class LoyaltyService {
  constructor(private readonly db: DatabaseService) {}

  async listTiers(tenantId: string) {
    const result = await this.db.query(
      `SELECT * FROM crm.loyalty_tiers WHERE tenant_id = $1 ORDER BY min_points ASC`,
      [tenantId],
    );
    return result.rows;
  }

  async createTier(tenantId: string, dto: any) {
    const result = await this.db.queryOne(
      `INSERT INTO crm.loyalty_tiers (tenant_id, name, min_points, multiplier, benefits, color)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tenantId, dto.name, dto.min_points || 0, dto.multiplier || 1.0,
       dto.benefits ? JSON.stringify(dto.benefits) : null, dto.color || null],
    );
    return result;
  }

  async updateTier(tenantId: string, id: string, dto: any) {
    const sets: string[] = [];
    const params: any[] = [id, tenantId];
    let idx = 3;

    for (const [key, val] of Object.entries(dto)) {
      if (['name', 'min_points', 'multiplier', 'color', 'is_active'].includes(key)) {
        sets.push(`${key} = $${idx}`);
        params.push(val);
        idx++;
      }
      if (key === 'benefits') {
        sets.push(`benefits = $${idx}`);
        params.push(JSON.stringify(val));
        idx++;
      }
    }
    if (sets.length === 0) throw new BadRequestException('No valid fields to update');

    const result = await this.db.queryOne(
      `UPDATE crm.loyalty_tiers SET ${sets.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      params,
    );
    if (!result) throw new NotFoundException('Tier not found');
    return result;
  }

  async listTransactions(tenantId: string, filters: any) {
    const { customerId, type, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;
    const conditions = ['lt.tenant_id = $1'];
    const params: any[] = [tenantId];
    let idx = 2;

    if (customerId) { conditions.push(`lt.customer_id = $${idx}`); params.push(customerId); idx++; }
    if (type) { conditions.push(`lt.type = $${idx}`); params.push(type); idx++; }

    const where = conditions.join(' AND ');
    const countResult = await this.db.query(
      `SELECT COUNT(*)::int as total FROM crm.loyalty_transactions lt WHERE ${where}`, params,
    );
    const result = await this.db.query(
      `SELECT lt.*,
        COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '') as customer_name
       FROM crm.loyalty_transactions lt
       LEFT JOIN sales.customers c ON c.id = lt.customer_id
       WHERE ${where}
       ORDER BY lt.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset],
    );

    return { data: result.rows, pagination: { total: countResult.rows[0].total, page, limit } };
  }

  async earnPoints(tenantId: string, userId: string, dto: any) {
    const { customer_id, points, reason, order_id } = dto;
    if (!customer_id || !points || points <= 0) {
      throw new BadRequestException('customer_id and positive points are required');
    }

    // Update customer points
    const customer = await this.db.queryOne(
      `UPDATE sales.customers SET loyalty_points = loyalty_points + $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3 RETURNING loyalty_points`,
      [points, customer_id, tenantId],
    );
    if (!customer) throw new NotFoundException('Customer not found');

    // Record transaction
    const tx = await this.db.queryOne(
      `INSERT INTO crm.loyalty_transactions (tenant_id, customer_id, type, points, balance_after, reason, order_id, created_by)
       VALUES ($1, $2, 'earn', $3, $4, $5, $6, $7) RETURNING *`,
      [tenantId, customer_id, points, customer.loyalty_points, reason || 'Points earned', order_id || null, userId],
    );

    // Auto-upgrade tier
    await this.autoUpgradeTier(tenantId, customer_id, customer.loyalty_points);

    return tx;
  }

  async redeemPoints(tenantId: string, userId: string, dto: any) {
    const { customer_id, points, reason, order_id } = dto;
    if (!customer_id || !points || points <= 0) {
      throw new BadRequestException('customer_id and positive points are required');
    }

    // Check balance
    const existing = await this.db.queryOne(
      'SELECT loyalty_points FROM sales.customers WHERE id = $1 AND tenant_id = $2',
      [customer_id, tenantId],
    );
    if (!existing) throw new NotFoundException('Customer not found');
    if (existing.loyalty_points < points) {
      throw new BadRequestException('Insufficient loyalty points');
    }

    // Deduct points
    const customer = await this.db.queryOne(
      `UPDATE sales.customers SET loyalty_points = loyalty_points - $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3 RETURNING loyalty_points`,
      [points, customer_id, tenantId],
    );

    // Record transaction
    const tx = await this.db.queryOne(
      `INSERT INTO crm.loyalty_transactions (tenant_id, customer_id, type, points, balance_after, reason, order_id, created_by)
       VALUES ($1, $2, 'redeem', $3, $4, $5, $6, $7) RETURNING *`,
      [tenantId, customer_id, points, customer.loyalty_points, reason || 'Points redeemed', order_id || null, userId],
    );

    return tx;
  }

  async getStats(tenantId: string) {
    const tierStats = await this.db.query(
      `SELECT c.loyalty_tier, COUNT(*)::int as customer_count
       FROM sales.customers c WHERE c.tenant_id = $1 AND c.is_active = true
       GROUP BY c.loyalty_tier ORDER BY customer_count DESC`,
      [tenantId],
    );

    const totals = await this.db.queryOne(
      `SELECT
        COALESCE(SUM(loyalty_points), 0)::int as total_points_outstanding,
        COUNT(*)::int as total_members,
        COUNT(*) FILTER (WHERE loyalty_points > 0)::int as active_members
       FROM sales.customers WHERE tenant_id = $1 AND is_active = true`,
      [tenantId],
    );

    const recentActivity = await this.db.queryOne(
      `SELECT
        COALESCE(SUM(points) FILTER (WHERE type = 'earn'), 0)::int as points_earned_30d,
        COALESCE(SUM(points) FILTER (WHERE type = 'redeem'), 0)::int as points_redeemed_30d,
        COUNT(*)::int as transactions_30d
       FROM crm.loyalty_transactions
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '30 days'`,
      [tenantId],
    );

    return { tiers: tierStats.rows, totals, recent_activity: recentActivity };
  }

  private async autoUpgradeTier(tenantId: string, customerId: string, currentPoints: number) {
    const tiers = await this.db.query(
      `SELECT name FROM crm.loyalty_tiers WHERE tenant_id = $1 AND is_active = true AND min_points <= $2
       ORDER BY min_points DESC LIMIT 1`,
      [tenantId, currentPoints],
    );
    if (tiers.rows.length > 0) {
      await this.db.query(
        `UPDATE sales.customers SET loyalty_tier = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3`,
        [tiers.rows[0].name, customerId, tenantId],
      );
    }
  }
}
