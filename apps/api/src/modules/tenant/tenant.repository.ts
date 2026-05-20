import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, isNull } from 'drizzle-orm';
import { DB_CONNECTION } from '../../database/database.constants';
import * as schema from '@brushia/db';

export interface CreateTenantData {
  name: string;
  slug: string;
  email: string;
  phone?: string;
  plan?: string;
  legalName?: string;
  taxId?: string;
  commercialReg?: string;
  governorate?: string;
  city?: string;
  currency?: string;
}

@Injectable()
export class TenantRepository {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase,
  ) {}

  async create(data: CreateTenantData) {
    const [tenant] = await this.db
      .insert(schema.tenants)
      .values({
        name: data.name,
        slug: data.slug,
        email: data.email,
        phone: data.phone,
        plan: data.plan ?? 'trial',
        legalName: data.legalName,
        taxId: data.taxId,
        commercialReg: data.commercialReg,
        governorate: data.governorate,
        city: data.city,
        currency: data.currency ?? 'EGP',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      })
      .returning();
    return tenant;
  }

  async findById(id: string) {
    const [tenant] = await this.db
      .select()
      .from(schema.tenants)
      .where(and(eq(schema.tenants.id, id), isNull(schema.tenants.deletedAt)));
    return tenant ?? null;
  }

  async findBySlug(slug: string) {
    const [tenant] = await this.db
      .select()
      .from(schema.tenants)
      .where(and(eq(schema.tenants.slug, slug), isNull(schema.tenants.deletedAt)));
    return tenant ?? null;
  }

  async update(id: string, data: Partial<CreateTenantData>) {
    const [tenant] = await this.db
      .update(schema.tenants)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.tenants.id, id))
      .returning();
    return tenant;
  }

  async softDelete(id: string) {
    const [tenant] = await this.db
      .update(schema.tenants)
      .set({ deletedAt: new Date(), status: 'cancelled' })
      .where(eq(schema.tenants.id, id))
      .returning();
    return tenant;
  }
}
