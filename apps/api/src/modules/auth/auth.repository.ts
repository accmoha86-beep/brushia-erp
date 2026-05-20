import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, isNull } from 'drizzle-orm';
import { DB_CONNECTION } from '../../database/database.constants';
import * as schema from '@brushia/db/schema/iam';

@Injectable()
export class AuthRepository {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase,
  ) {}

  async findUserByEmail(tenantId: string, email: string) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.tenantId, tenantId),
          eq(schema.users.email, email.toLowerCase()),
          isNull(schema.users.deletedAt),
        ),
      );
    return user ?? null;
  }

  async findUserById(id: string) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.id, id), isNull(schema.users.deletedAt)));
    return user ?? null;
  }

  async createUser(data: {
    tenantId: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    const [user] = await this.db
      .insert(schema.users)
      .values({
        tenantId: data.tenantId,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      })
      .returning();
    return user;
  }

  async updateLastLogin(userId: string) {
    await this.db
      .update(schema.users)
      .set({ lastLoginAt: new Date(), failedLoginAttempts: 0 })
      .where(eq(schema.users.id, userId));
  }

  async incrementFailedAttempts(userId: string) {
    await this.db.execute(
      `UPDATE iam.users SET failed_login_attempts = failed_login_attempts + 1, updated_at = NOW() WHERE id = $1`,
      // Note: In production, use the Drizzle sql`` tagged template for this
    );
  }

  async updatePassword(userId: string, passwordHash: string) {
    await this.db
      .update(schema.users)
      .set({
        passwordHash,
        passwordChangedAt: new Date(),
        mustChangePassword: false,
        failedLoginAttempts: 0,
      })
      .where(eq(schema.users.id, userId));
  }

  /**
   * Get all permissions for a user via their roles.
   * This is the core RBAC query.
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const results = await this.db
      .select({ code: schema.permissions.code })
      .from(schema.userRoles)
      .innerJoin(schema.rolePermissions, eq(schema.userRoles.roleId, schema.rolePermissions.roleId))
      .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
      .where(eq(schema.userRoles.userId, userId));

    return [...new Set(results.map((r) => r.code))];
  }
}
