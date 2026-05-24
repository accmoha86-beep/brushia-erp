import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class PromotionService {
  constructor(private readonly db: DatabaseService) {}

  async list(tenantId: string, status?: string) {
    let query = `SELECT *, 
      COALESCE(status, CASE WHEN is_active THEN 'active' ELSE 'inactive' END) as status,
      COALESCE(start_date, starts_at::date) as start_date,
      COALESCE(end_date, ends_at::date) as end_date,
      COALESCE(usage_count, used_count, 0) as usage_count
      FROM sales.promotions WHERE tenant_id = $1`;
    const params: any[] = [tenantId];
    if (status === 'active') { query += ` AND (status = 'active' OR is_active = true)`; }
    if (status === 'inactive') { query += ` AND (status = 'inactive' OR is_active = false)`; }
    if (status === 'expired') { query += ` AND status = 'expired'`; }
    query += ' ORDER BY created_at DESC';
    const result = await this.db.query(query, params);
    return { data: result.rows };
  }

  async getById(tenantId: string, id: string) {
    const result = await this.db.queryOne(
      `SELECT *,
        COALESCE(status, CASE WHEN is_active THEN 'active' ELSE 'inactive' END) as status,
        COALESCE(start_date, starts_at::date) as start_date,
        COALESCE(end_date, ends_at::date) as end_date,
        COALESCE(usage_count, used_count, 0) as usage_count
       FROM sales.promotions WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    if (!result) throw new NotFoundException('Promotion not found');
    return result;
  }

  async validateCode(tenantId: string, code: string, orderAmount: number) {
    const promo = await this.db.queryOne(
      `SELECT *,
        COALESCE(start_date, starts_at::date) as start_date,
        COALESCE(end_date, ends_at::date) as end_date,
        COALESCE(usage_count, used_count, 0) as usage_count
       FROM sales.promotions WHERE tenant_id = $1 AND code = $2 
       AND (status = 'active' OR is_active = true)
       AND (start_date IS NULL AND starts_at IS NULL OR COALESCE(start_date, starts_at::date) <= CURRENT_DATE)
       AND (end_date IS NULL AND ends_at IS NULL OR COALESCE(end_date, ends_at::date) >= CURRENT_DATE)`,
      [tenantId, code.toUpperCase()]
    );
    if (!promo) return { valid: false, message: 'Invalid or expired promo code' };
    const usageCount = promo.usage_count || 0;
    if (promo.usage_limit && usageCount >= promo.usage_limit) return { valid: false, message: 'Promo code usage limit reached' };
    if (promo.min_order_amount && orderAmount < promo.min_order_amount) return { valid: false, message: `Minimum order amount is ${promo.min_order_amount}` };
    const discount = promo.type === 'percentage' ? Math.round(orderAmount * promo.value / 100) : promo.value;
    return { valid: true, promotion: promo, discount_amount: discount };
  }

  async create(tenantId: string, dto: any) {
    const result = await this.db.queryOne(
      `INSERT INTO sales.promotions (tenant_id, name, type, value, code, status, is_active, start_date, starts_at, end_date, ends_at, usage_limit, min_order_amount, applies_to, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $9, $10, $11, $12, $13) RETURNING *,
       COALESCE(status, CASE WHEN is_active THEN 'active' ELSE 'inactive' END) as status,
       COALESCE(start_date, starts_at::date) as start_date,
       COALESCE(end_date, ends_at::date) as end_date,
       0 as usage_count`,
      [tenantId, dto.name, dto.type || 'percentage', dto.value, (dto.code || '').toUpperCase(),
       dto.status || 'active', dto.status !== 'inactive',
       dto.start_date || null, dto.end_date || null,
       dto.usage_limit || null, dto.min_order_amount || 0, dto.applies_to || 'all', dto.description || null]
    );
    return result;
  }

  async update(tenantId: string, id: string, dto: any) {
    const sets: string[] = []; const params: any[] = [id, tenantId]; let idx = 3;
    for (const [key, val] of Object.entries(dto)) {
      if (['name','type','value','code','status','start_date','end_date','usage_limit','min_order_amount','applies_to','description','is_active'].includes(key)) {
        if (key === 'start_date') {
          sets.push(`start_date = $${idx}, starts_at = $${idx}`);
        } else if (key === 'end_date') {
          sets.push(`end_date = $${idx}, ends_at = $${idx}`);
        } else if (key === 'status') {
          sets.push(`status = $${idx}`);
          params.push(val); idx++;
          sets.push(`is_active = $${idx}`);
          params.push(val === 'active');
          idx++;
          continue;
        } else {
          sets.push(`${key} = $${idx}`);
        }
        params.push(key === 'code' ? String(val).toUpperCase() : val); idx++;
      }
    }
    if (sets.length === 0) return this.getById(tenantId, id);
    sets.push('updated_at = NOW()');
    const result = await this.db.queryOne(
      `UPDATE sales.promotions SET ${sets.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *,
       COALESCE(status, CASE WHEN is_active THEN 'active' ELSE 'inactive' END) as status,
       COALESCE(start_date, starts_at::date) as start_date,
       COALESCE(end_date, ends_at::date) as end_date,
       COALESCE(usage_count, used_count, 0) as usage_count`,
      params
    );
    if (!result) throw new NotFoundException('Promotion not found');
    return result;
  }

  async deactivate(tenantId: string, id: string) {
    await this.db.query(
      "UPDATE sales.promotions SET status = 'inactive', is_active = false, updated_at = NOW() WHERE id = $1 AND tenant_id = $2",
      [id, tenantId]
    );
    return { success: true };
  }

  async incrementUsage(tenantId: string, id: string) {
    await this.db.query(
      'UPDATE sales.promotions SET usage_count = COALESCE(usage_count, 0) + 1, used_count = COALESCE(used_count, 0) + 1 WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
  }
}
