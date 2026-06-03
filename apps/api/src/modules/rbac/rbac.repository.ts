import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import { DB_CONNECTION } from '../../database/database.constants';
import * as schema from '@brushia/db';

@Injectable()
export class RbacRepository {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase,
  ) {}

  // ---- Roles ----

  async getUsersForTenant(tenantId: string) {
    const result = await this.db.execute(
      sql`SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.status, 
              u.last_login_at, u.created_at
       FROM iam.users u
       WHERE u.tenant_id = ${tenantId} AND u.deleted_at IS NULL
       ORDER BY u.created_at DESC`
    );
    return result.rows;
  }

  async findRolesByTenant(tenantId: string) {
    return this.db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.tenantId, tenantId));
  }

  async findRoleById(id: string) {
    const [role] = await this.db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.id, id));
    return role ?? null;
  }

  async createRole(data: {
    tenantId: string;
    name: string;
    slug: string;
    description?: string;
    isSystem?: boolean;
    isDefault?: boolean;
  }) {
    const [role] = await this.db
      .insert(schema.roles)
      .values(data)
      .returning();
    return role;
  }

  async deleteRole(id: string) {
    await this.db.delete(schema.roles).where(eq(schema.roles.id, id));
  }

  // ---- Permissions ----

  async findAllPermissions() {
    return this.db
      .select()
      .from(schema.permissions)
      .orderBy(schema.permissions.displayOrder);
  }

  async findPermissionsByModule(module: string) {
    return this.db
      .select()
      .from(schema.permissions)
      .where(eq(schema.permissions.module, module));
  }

  // ---- Role-Permission assignments ----

  async getRolePermissions(roleId: string) {
    return this.db
      .select({ code: schema.permissions.code, description: schema.permissions.description })
      .from(schema.rolePermissions)
      .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
      .where(eq(schema.rolePermissions.roleId, roleId));
  }

  async setRolePermissions(roleId: string, permissionIds: string[], grantedBy: string) {
    // Delete existing
    await this.db.delete(schema.rolePermissions).where(eq(schema.rolePermissions.roleId, roleId));

    // Insert new
    if (permissionIds.length > 0) {
      await this.db.insert(schema.rolePermissions).values(
        permissionIds.map((pid) => ({
          roleId,
          permissionId: pid,
          grantedBy,
        })),
      );
    }
  }

  // ---- User-Role assignments ----

  async getUserRoles(userId: string) {
    return this.db
      .select({
        roleId: schema.userRoles.roleId,
        roleName: schema.roles.name,
        roleSlug: schema.roles.slug,
        branchId: schema.userRoles.branchId,
      })
      .from(schema.userRoles)
      .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
      .where(eq(schema.userRoles.userId, userId));
  }

  async assignUserRole(data: {
    userId: string;
    roleId: string;
    branchId?: string;
    assignedBy: string;
    expiresAt?: Date;
  }) {
    await this.db.insert(schema.userRoles).values({
      userId: data.userId,
      roleId: data.roleId,
      branchId: data.branchId,
      assignedBy: data.assignedBy,
      expiresAt: data.expiresAt,
    });
  }

  async removeUserRole(userId: string, roleId: string) {
    await this.db
      .delete(schema.userRoles)
      .where(
        and(
          eq(schema.userRoles.userId, userId),
          eq(schema.userRoles.roleId, roleId),
        ),
      );
  }

  /**
   * Create default system roles for a new tenant.
   * Called during tenant onboarding.
   */
  async createDefaultRolesForTenant(tenantId: string) {
    const defaultRoles = [
      {
        name: 'Owner',
        slug: 'owner',
        description: 'Full access to everything. Cannot be deleted.',
        isSystem: true,
      },
      {
        name: 'Admin',
        slug: 'admin',
        description: 'Full management access except billing and tenant settings.',
        isSystem: true,
      },
      {
        name: 'Manager',
        slug: 'manager',
        description: 'Branch-level management: inventory, sales, staff.',
        isSystem: true,
      },
      {
        name: 'Accountant',
        slug: 'accountant',
        description: 'Financial operations: journals, reports, reconciliation.',
        isSystem: true,
      },
      {
        name: 'Cashier',
        slug: 'cashier',
        description: 'POS access only: sales, payments, basic customer lookup.',
        isSystem: true,
        isDefault: true,
      },
      {
        name: 'Warehouse Staff',
        slug: 'warehouse-staff',
        description: 'Inventory operations: receiving, transfers, stock counts.',
        isSystem: true,
      },
      {
        name: 'Viewer',
        slug: 'viewer',
        description: 'Read-only access to dashboards and reports.',
        isSystem: true,
      },
    ];

    const roles = await this.db
      .insert(schema.roles)
      .values(defaultRoles.map((r) => ({ ...r, tenantId })))
      .returning();

    return roles;
  }
}
