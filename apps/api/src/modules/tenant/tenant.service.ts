import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { TenantRepository, CreateTenantData } from './tenant.repository';

@Injectable()
export class TenantService {
  constructor(private readonly tenantRepo: TenantRepository) {}

  async createTenant(data: CreateTenantData) {
    // Validate slug uniqueness
    const existing = await this.tenantRepo.findBySlug(data.slug);
    if (existing) {
      throw new ConflictException(`Tenant slug "${data.slug}" is already taken`);
    }

    return this.tenantRepo.create(data);
  }

  async getTenant(id: string) {
    const tenant = await this.tenantRepo.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant ${id} not found`);
    }
    return tenant;
  }

  async getTenantBySlug(slug: string) {
    const tenant = await this.tenantRepo.findBySlug(slug);
    if (!tenant) {
      throw new NotFoundException(`Tenant "${slug}" not found`);
    }
    return tenant;
  }

  async updateTenant(id: string, data: Partial<CreateTenantData>) {
    await this.getTenant(id); // Throws if not found
    return this.tenantRepo.update(id, data);
  }

  async deleteTenant(id: string) {
    await this.getTenant(id); // Throws if not found
    return this.tenantRepo.softDelete(id);
  }
}
