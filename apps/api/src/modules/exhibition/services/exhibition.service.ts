import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class ExhibitionService {
  constructor(private readonly db: DatabaseService) {}

  async list(tenantId: string, filters: any) {
    const { status, city, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;
    const conditions = ['e.tenant_id = $1'];
    const params: any[] = [tenantId];
    let idx = 2;

    if (status) { conditions.push(`e.status = $${idx}`); params.push(status); idx++; }
    if (city) { conditions.push(`e.city ILIKE $${idx}`); params.push(`%${city}%`); idx++; }

    const where = conditions.join(' AND ');
    const countResult = await this.db.query(
      `SELECT COUNT(*)::int as total FROM exhibitions.events e WHERE ${where}`, params,
    );
    const result = await this.db.query(
      `SELECT e.*
       FROM exhibitions.events e WHERE ${where}
       ORDER BY e.start_date DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset],
    );

    return { data: result.rows, pagination: { total: countResult.rows[0].total, page, limit } };
  }

  async getById(tenantId: string, id: string) {
    const event = await this.db.queryOne(
      'SELECT * FROM exhibitions.events WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
    );
    if (!event) throw new NotFoundException('Exhibition event not found');

    const expenses = await this.db.query(
      `SELECT * FROM exhibitions.event_expenses WHERE event_id = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [id, tenantId],
    );

    return { ...event, expenses: expenses.rows };
  }

  async create(tenantId: string, userId: string, dto: any) {
    const result = await this.db.queryOne(
      `INSERT INTO exhibitions.events
        (tenant_id, event_code, name, venue, city, governorate, start_date, end_date, budget_amount, warehouse_id, notes, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'planning', $12) RETURNING *`,
      [tenantId, dto.event_code, dto.name, dto.venue || null, dto.city || null, dto.governorate || null,
       dto.start_date, dto.end_date, dto.budget_amount || 0, dto.warehouse_id || null, dto.notes || null, userId],
    );
    return result;
  }

  async update(tenantId: string, id: string, dto: any) {
    const sets: string[] = [];
    const params: any[] = [id, tenantId];
    let idx = 3;

    for (const [key, val] of Object.entries(dto)) {
      if (['name', 'event_code', 'venue', 'city', 'governorate', 'start_date', 'end_date',
           'budget_amount', 'warehouse_id', 'notes', 'total_visitors'].includes(key)) {
        sets.push(`${key} = $${idx}`);
        params.push(val);
        idx++;
      }
    }
    if (sets.length === 0) return this.getById(tenantId, id);
    sets.push('updated_at = NOW()');

    const result = await this.db.queryOne(
      `UPDATE exhibitions.events SET ${sets.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      params,
    );
    if (!result) throw new NotFoundException('Exhibition event not found');
    return result;
  }

  async updateStatus(tenantId: string, id: string, status: string) {
    const validStatuses = ['planning', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const result = await this.db.queryOne(
      `UPDATE exhibitions.events SET status = $3, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      [id, tenantId, status],
    );
    if (!result) throw new NotFoundException('Exhibition event not found');
    return result;
  }

  async addExpense(tenantId: string, eventId: string, dto: any) {
    // Verify event exists
    const event = await this.db.queryOne(
      'SELECT id FROM exhibitions.events WHERE id = $1 AND tenant_id = $2',
      [eventId, tenantId],
    );
    if (!event) throw new NotFoundException('Exhibition event not found');

    const expense = await this.db.queryOne(
      `INSERT INTO exhibitions.event_expenses (tenant_id, event_id, category, description, amount, receipt_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tenantId, eventId, dto.category, dto.description || null, dto.amount, dto.receipt_url || null],
    );

    // Update actual_cost on event
    await this.db.query(
      `UPDATE exhibitions.events SET actual_cost = (
        SELECT COALESCE(SUM(amount), 0) FROM exhibitions.event_expenses WHERE event_id = $1 AND tenant_id = $2
       ), updated_at = NOW() WHERE id = $1 AND tenant_id = $2`,
      [eventId, tenantId],
    );

    return expense;
  }

  async removeExpense(tenantId: string, eventId: string, expenseId: string) {
    const result = await this.db.queryOne(
      `DELETE FROM exhibitions.event_expenses WHERE id = $1 AND event_id = $2 AND tenant_id = $3 RETURNING id`,
      [expenseId, eventId, tenantId],
    );
    if (!result) throw new NotFoundException('Expense not found');

    // Recalculate actual_cost
    await this.db.query(
      `UPDATE exhibitions.events SET actual_cost = (
        SELECT COALESCE(SUM(amount), 0) FROM exhibitions.event_expenses WHERE event_id = $1 AND tenant_id = $2
       ), updated_at = NOW() WHERE id = $1 AND tenant_id = $2`,
      [eventId, tenantId],
    );

    return { success: true };
  }

  async getPnl(tenantId: string, eventId: string) {
    const event = await this.db.queryOne(
      'SELECT total_sales, actual_cost, budget_amount, total_orders, total_visitors, name, event_code FROM exhibitions.events WHERE id = $1 AND tenant_id = $2',
      [eventId, tenantId],
    );
    if (!event) throw new NotFoundException('Exhibition event not found');

    const expenses = await this.db.query(
      `SELECT category, SUM(amount)::bigint as total
       FROM exhibitions.event_expenses WHERE event_id = $1 AND tenant_id = $2
       GROUP BY category ORDER BY total DESC`,
      [eventId, tenantId],
    );

    const totalSales = event.total_sales || 0;
    const totalCost = event.actual_cost || 0;
    const profit = totalSales - totalCost;
    const margin = totalSales > 0 ? ((profit / totalSales) * 100).toFixed(2) : '0.00';

    return {
      event_name: event.name,
      event_code: event.event_code,
      total_sales: totalSales,
      actual_cost: totalCost,
      budget_amount: event.budget_amount,
      profit,
      margin_percent: parseFloat(margin),
      total_orders: event.total_orders || 0,
      total_visitors: event.total_visitors || 0,
      expense_breakdown: expenses.rows,
    };
  }
}
