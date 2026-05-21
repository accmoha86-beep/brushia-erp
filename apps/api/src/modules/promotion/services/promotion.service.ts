import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class PromotionService {
  constructor(private readonly db: DatabaseService) {}

  async list(tenantId: string, status?: string) {
    let query = 'SELECT * FROM sales.promotions WHERE tenant_id = $1';
    const params: any[] = [tenantId];
    if (status) { query += ' AND status = $2'; params.push(status); }
    query += ' ORDER BY created_at DESC';
    const result = await this.db.query(query, params);
    return { data: result.rows };
  }

  async getById(tenantId: string, id: string) {
    const result = await this.db.queryOne('SELECT * FROM sales.promotions WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (!result) throw new NotFoundException('Promotion not found');
    return result;
  }

  async validateCode(tenantId: string, code: string, orderAmount: number) {
    const promo = await this.db.queryOne(
      `SELECT * FROM sales.promotions WHERE tenant_id = $1 AND code = $2 AND status = 'active'
       AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW())`,
      [tenantId, code.toUpperCase()]
    );
    if (!promo) return { valid: false, message: 'Invalid or expired promo code' };
    if (promo.usage_limit && promo.usage_count >= promo.usage_limit) return { valid: false, message: 'Promo code usage limit reached' };
    if (promo.min_order_amount && orderAmount < promo.min_order_amount) return { valid: false, message: `Minimum order amount is ${promo.min_order_amount}` };
    const discount = promo.type === 'percentage' ? Math.round(orderAmount * promo.value / 100) : promo.value;
    return { valid: true, promotion: promo, discount_amount: discount };
  }

  async create(tenantId: string, dto: any) {
    const result = await this.db.queryOne(
      `INSERT INTO sales.promotions (tenant_id, name, type, value, code, status, start_date, end_date, usage_limit, min_order_amount, applies_to, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [tenantId, dto.name, dto.type || 'percentage', dto.value, (dto.code || '').toUpperCase(),
       dto.status || 'active', dto.start_date || null, dto.end_date || null,
       dto.usage_limit || null, dto.min_order_amount || 0, dto.applies_to || 'all', dto.description || null]
    );
    return result;
  }

  async update(tenantId: string, id: string, dto: any) {
    const sets: string[] = []; const params: any[] = [id, tenantId]; let idx = 3;
    for (const [key, val] of Object.entries(dto)) {
      if (['name','type','value','code','status','start_date','end_date','usage_limit','min_order_amount','applies_to','description'].includes(key)) {
        sets.push(`${key} = $${idx}`); params.push(key === 'code' ? String(val).toUpperCase() : val); idx++;
      }
    }
    if (sets.length === 0) return this.getById(tenantId, id);
    sets.push('updated_at = NOW()');
    const result = await this.db.queryOne(`UPDATE sales.promotions SET ${sets.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`, params);
    if (!result) throw new NotFoundException('Promotion not found');
    return result;
  }

  async deactivate(tenantId: string, id: string) {
    await this.db.query("UPDATE sales.promotions SET status = 'inactive', updated_at = NOW() WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
    return { success: true };
  }

  async incrementUsage(tenantId: string, id: string) {
    await this.db.query('UPDATE sales.promotions SET usage_count = usage_count + 1 WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  }
}