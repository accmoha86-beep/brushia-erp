import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class CommissionService {
  constructor(private readonly db: DatabaseService) {}

  async listSalespersons(tenantId: string, filters: any) {
    const { search, status, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;
    const conditions = ['s.tenant_id = $1'];
    const params: any[] = [tenantId];
    let idx = 2;

    if (search) {
      conditions.push(`(s.first_name ILIKE $${idx} OR s.last_name ILIKE $${idx} OR s.employee_code ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (status === 'active') { conditions.push('s.is_active = true'); }
    if (status === 'inactive') { conditions.push('s.is_active = false'); }

    const where = conditions.join(' AND ');
    const countResult = await this.db.query(
      `SELECT COUNT(*)::int as total FROM hr.salespersons s WHERE ${where}`, params,
    );
    const result = await this.db.query(
      `SELECT s.*,
        COALESCE(s.first_name, '') || ' ' || COALESCE(s.last_name, '') as full_name,
        (SELECT COUNT(*)::int FROM hr.commissions c WHERE c.salesperson_id = s.id AND c.status = 'pending') as pending_commissions
       FROM hr.salespersons s WHERE ${where}
       ORDER BY s.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset],
    );

    return { data: result.rows, pagination: { total: countResult.rows[0].total, page, limit } };
  }

  async listRules(tenantId: string) {
    const result = await this.db.query(
      `SELECT * FROM hr.commission_rules WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId],
    );
    return result.rows;
  }

  async getSalesperson(tenantId: string, id: string) {
    const salesperson = await this.db.queryOne(
      'SELECT * FROM hr.salespersons WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
    );
    if (!salesperson) throw new NotFoundException('Salesperson not found');

    const commissions = await this.db.query(
      `SELECT c.*, so.order_number
       FROM hr.commissions c
       LEFT JOIN sales.sales_orders so ON so.id = c.sales_order_id
       WHERE c.salesperson_id = $1 AND c.tenant_id = $2
       ORDER BY c.created_at DESC LIMIT 100`,
      [id, tenantId],
    );

    return { ...salesperson, commissions: commissions.rows };
  }

  async createSalesperson(tenantId: string, dto: any) {
    const result = await this.db.queryOne(
      `INSERT INTO hr.salespersons (tenant_id, employee_code, first_name, last_name, phone, email, default_commission_rate, commission_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [tenantId, dto.employee_code, dto.first_name, dto.last_name, dto.phone || null,
       dto.email || null, dto.default_commission_rate || 0, dto.commission_type || 'percentage'],
    );
    return result;
  }

  async updateSalesperson(tenantId: string, id: string, dto: any) {
    const sets: string[] = [];
    const params: any[] = [id, tenantId];
    let idx = 3;

    for (const [key, val] of Object.entries(dto)) {
      if (['first_name', 'last_name', 'phone', 'email', 'default_commission_rate', 'commission_type', 'is_active', 'assigned_branches'].includes(key)) {
        sets.push(`${key} = $${idx}`);
        params.push(val);
        idx++;
      }
    }
    if (sets.length === 0) return this.getSalesperson(tenantId, id);
    sets.push('updated_at = NOW()');

    const result = await this.db.queryOne(
      `UPDATE hr.salespersons SET ${sets.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      params,
    );
    if (!result) throw new NotFoundException('Salesperson not found');
    return result;
  }

  async calculateCommission(tenantId: string, dto: any) {
    const { salesperson_id, order_id, order_total } = dto;
    if (!salesperson_id || !order_id || order_total == null) {
      throw new BadRequestException('salesperson_id, order_id, and order_total are required');
    }

    const sp = await this.db.queryOne(
      'SELECT * FROM hr.salespersons WHERE id = $1 AND tenant_id = $2',
      [salesperson_id, tenantId],
    );
    if (!sp) throw new NotFoundException('Salesperson not found');

    const rate = sp.default_commission_rate;
    const commissionAmount = Math.round(order_total * rate / 100);

    const result = await this.db.queryOne(
      `INSERT INTO hr.commissions (tenant_id, salesperson_id, sales_order_id, order_total, commission_rate, commission_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING *`,
      [tenantId, salesperson_id, order_id, order_total, rate, commissionAmount],
    );

    // Update salesperson totals
    await this.db.query(
      `UPDATE hr.salespersons SET total_sales = total_sales + $1, total_commission = total_commission + $2, updated_at = NOW()
       WHERE id = $3 AND tenant_id = $4`,
      [order_total, commissionAmount, salesperson_id, tenantId],
    );

    return result;
  }

  async approveCommission(tenantId: string, commissionId: string, approvedBy: string) {
    const result = await this.db.queryOne(
      `UPDATE hr.commissions SET status = 'approved', approved_by = $3, approved_at = NOW()
       WHERE id = $1 AND tenant_id = $2 AND status = 'pending' RETURNING *`,
      [commissionId, tenantId, approvedBy],
    );
    if (!result) throw new NotFoundException('Commission not found or not pending');
    return result;
  }

  async payCommission(tenantId: string, commissionId: string, paymentReference: string) {
    const result = await this.db.queryOne(
      `UPDATE hr.commissions SET status = 'paid', paid_at = NOW(), payment_reference = $3
       WHERE id = $1 AND tenant_id = $2 AND status = 'approved' RETURNING *`,
      [commissionId, tenantId, paymentReference],
    );
    if (!result) throw new NotFoundException('Commission not found or not approved');
    return result;
  }

  async getReport(tenantId: string, from?: string, to?: string) {
    const conditions = ['c.tenant_id = $1'];
    const params: any[] = [tenantId];
    let idx = 2;

    if (from) { conditions.push(`c.created_at >= $${idx}`); params.push(from); idx++; }
    if (to) { conditions.push(`c.created_at <= $${idx}`); params.push(to); idx++; }

    const where = conditions.join(' AND ');

    const summary = await this.db.query(
      `SELECT
        COUNT(*)::int as total_commissions,
        COUNT(*) FILTER (WHERE c.status = 'pending')::int as pending_count,
        COUNT(*) FILTER (WHERE c.status = 'approved')::int as approved_count,
        COUNT(*) FILTER (WHERE c.status = 'paid')::int as paid_count,
        COALESCE(SUM(c.commission_amount), 0)::bigint as total_amount,
        COALESCE(SUM(c.commission_amount) FILTER (WHERE c.status = 'paid'), 0)::bigint as paid_amount
       FROM hr.commissions c WHERE ${where}`,
      params,
    );

    const bySalesperson = await this.db.query(
      `SELECT s.id, s.employee_code, s.first_name, s.last_name,
        COUNT(c.id)::int as commission_count,
        COALESCE(SUM(c.order_total), 0)::bigint as total_sales,
        COALESCE(SUM(c.commission_amount), 0)::bigint as total_commission
       FROM hr.salespersons s
       LEFT JOIN hr.commissions c ON c.salesperson_id = s.id AND ${where.replace('c.tenant_id = $1', 'c.tenant_id = s.tenant_id')}
       WHERE s.tenant_id = $1
       GROUP BY s.id, s.employee_code, s.first_name, s.last_name
       ORDER BY total_commission DESC`,
      params,
    );

    return { summary: summary.rows[0], by_salesperson: bySalesperson.rows };
  }
}
