import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class BranchService {
  private readonly logger = new Logger(BranchService.name);

  constructor(private readonly db: DatabaseService) {}

  async listBranches(tenantId: string, filters: any = {}) {
    let where = 'b.tenant_id = $1';
    const params: any[] = [tenantId];
    let idx = 2;

    if (filters.type) {
      where += ` AND b.branch_type = $${idx++}`;
      params.push(filters.type);
    }
    if (filters.is_active !== undefined) {
      where += ` AND b.is_active = $${idx++}`;
      params.push(filters.is_active === 'true');
    }

    const rows = await this.db.query(
      `SELECT b.*,
        w.name as warehouse_name,
        (SELECT COUNT(*)::int FROM pos.registers r WHERE r.branch_id = b.id) as register_count,
        (SELECT COUNT(*)::int FROM pos.sessions s 
          JOIN pos.registers r ON r.id = s.register_id 
          WHERE r.branch_id = b.id AND s.status = 'open') as open_sessions
      FROM pos.branches b
      LEFT JOIN inventory.warehouses w ON w.id = b.warehouse_id
      WHERE ${where}
      ORDER BY b.created_at DESC`,
      params,
    );

    return { data: rows, total: rows.length };
  }

  async getBranch(tenantId: string, id: string) {
    const branch = await this.db.queryOne(
      `SELECT b.*, w.name as warehouse_name
      FROM pos.branches b
      LEFT JOIN inventory.warehouses w ON w.id = b.warehouse_id
      WHERE b.id = $1 AND b.tenant_id = $2`,
      [id, tenantId],
    );
    if (!branch) throw new NotFoundException('Branch not found');

    const registers = await this.db.query(
      `SELECT r.*, 
        (SELECT COUNT(*)::int FROM pos.sessions s WHERE s.register_id = r.id AND s.status = 'open') as open_sessions
      FROM pos.registers r WHERE r.branch_id = $1 AND r.tenant_id = $2
      ORDER BY r.created_at`,
      [id, tenantId],
    );

    return { ...branch, registers };
  }

  async createBranch(tenantId: string, userId: string, dto: any) {
    const existing = await this.db.queryOne(
      'SELECT id FROM pos.branches WHERE code = $1 AND tenant_id = $2',
      [dto.code, tenantId],
    );
    if (existing) throw new ConflictException('Branch code already exists');

    const branch = await this.db.queryOne(
      `INSERT INTO pos.branches (tenant_id, name, code, branch_type, address_line1, city, governorate, phone, manager_name, warehouse_id, is_active, event_start_date, event_end_date, event_venue, event_notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [tenantId, dto.name, dto.code, dto.branch_type || 'permanent', dto.address_line1 || null, dto.city || null, dto.governorate || null, dto.phone || null, dto.manager_name || null, dto.warehouse_id || null, dto.is_active ?? true, dto.event_start_date || null, dto.event_end_date || null, dto.event_venue || null, dto.event_notes || null],
    );

    this.logger.log(`Branch created: ${branch.name} (${branch.code}) type=${branch.branch_type}`);
    return branch;
  }

  async updateBranch(tenantId: string, id: string, dto: any) {
    const allowed = ['name', 'address_line1', 'city', 'governorate', 'phone', 'manager_name', 'warehouse_id', 'is_active', 'branch_type', 'event_start_date', 'event_end_date', 'event_venue', 'event_notes'];
    const sets: string[] = [];
    const vals: any[] = [id, tenantId];
    let idx = 3;

    for (const key of allowed) {
      if (dto[key] !== undefined) {
        sets.push(`${key} = $${idx++}`);
        vals.push(dto[key]);
      }
    }
    if (sets.length === 0) return this.getBranch(tenantId, id);

    sets.push(`updated_at = NOW()`);
    const result = await this.db.queryOne(
      `UPDATE pos.branches SET ${sets.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      vals,
    );
    if (!result) throw new NotFoundException('Branch not found');
    return result;
  }

  async deleteBranch(tenantId: string, id: string) {
    await this.db.queryOne(
      `UPDATE pos.branches SET is_active = false, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING id`,
      [id, tenantId],
    );
    return { success: true };
  }
}
