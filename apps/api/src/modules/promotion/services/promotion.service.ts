import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class PromotionService {
  constructor(private readonly db: DatabaseService) {}

  // Helper to build a safe SELECT that works with both old and new column names
  private selectCols() {
    return `*,
      CASE WHEN is_active THEN 'active' ELSE 'inactive' END as status,
      starts_at as start_date,
      ends_at as end_date,
      COALESCE(used_count, 0) as usage_count`;
  }

  async list(tenantId: string, statusFilter?: string) {
    let query = `SELECT ${this.selectCols()} FROM sales.promotions WHERE tenant_id = $1`;
    const params: any[] = [tenantId];
    if (statusFilter === 'active') { query += ` AND is_active = true`; }
    if (statusFilter === 'inactive') { query += ` AND is_active = false`; }
    query += ' ORDER BY created_at DESC';
    const result = await this.db.query(query, params);
    return { data: result.rows };
  }

  async getById(tenantId: string, id: string) {
    const result = await this.db.queryOne(
      `SELECT ${this.selectCols()} FROM sales.promotions WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    if (!result) throw new NotFoundException('Promotion not found');
    return result;
  }

  async validateCode(tenantId: string, code: string, orderAmount: number) {
    const promo = await this.db.queryOne(
      `SELECT ${this.selectCols()} FROM sales.promotions WHERE tenant_id = $1 AND code = $2 
       AND is_active = true
       AND (starts_at IS NULL OR starts_at <= NOW())
       AND (ends_at IS NULL OR ends_at >= NOW())`,
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
    const isActive = dto.status !== 'inactive';
    const result = await this.db.queryOne(
      `INSERT INTO sales.promotions (tenant_id, name, type, value, code, is_active, starts_at, ends_at, usage_limit, min_order_amount, applies_to, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING ${this.selectCols()}`,
      [tenantId, dto.name, dto.type || 'percentage', dto.value, (dto.code || '').toUpperCase(),
       isActive, dto.start_date || null, dto.end_date || null,
       dto.usage_limit || null, dto.min_order_amount || 0, dto.applies_to || 'all', dto.description || null]
    );
    return result;
  }

  async update(tenantId: string, id: string, dto: any) {
    const sets: string[] = []; const params: any[] = [id, tenantId]; let idx = 3;
    for (const [key, val] of Object.entries(dto)) {
      // Map frontend field names to actual DB column names
      const colMap: Record<string, string> = {
        start_date: 'starts_at', end_date: 'ends_at', status: 'is_active',
      };
      const dbCol = colMap[key] || key;
      
      if (['name','type','value','code','is_active','starts_at','ends_at','usage_limit','min_order_amount','applies_to','description'].includes(dbCol)) {
        let dbVal: any = val;
        if (key === 'code') dbVal = String(val).toUpperCase();
        if (key === 'status') dbVal = val === 'active';
        sets.push(`${dbCol} = $${idx}`);
        params.push(dbVal);
        idx++;
      }
    }
    if (sets.length === 0) return this.getById(tenantId, id);
    sets.push('updated_at = NOW()');
    const result = await this.db.queryOne(
      `UPDATE sales.promotions SET ${sets.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING ${this.selectCols()}`,
      params
    );
    if (!result) throw new NotFoundException('Promotion not found');
    return result;
  }

  async deactivate(tenantId: string, id: string) {
    await this.db.query(
      "UPDATE sales.promotions SET is_active = false, updated_at = NOW() WHERE id = $1 AND tenant_id = $2",
      [id, tenantId]
    );
    return { success: true };
  }

  async incrementUsage(tenantId: string, id: string) {
    await this.db.query(
      'UPDATE sales.promotions SET used_count = COALESCE(used_count, 0) + 1 WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
  }
}
