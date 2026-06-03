import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { RbacRepository } from './rbac.repository';

@Injectable()
export class RbacService {
  constructor(private readonly rbacRepo: RbacRepository) {}

  async getUsersForTenant(tenantId: string) {
    return this.rbacRepo.getUsersForTenant(tenantId);
  }

  async getRolesForTenant(tenantId: string) {
    return this.rbacRepo.findRolesByTenant(tenantId);
  }

  async getAllPermissions() {
    return this.rbacRepo.findAllPermissions();
  }

  async getPermissionsByModule(module: string) {
    return this.rbacRepo.findPermissionsByModule(module);
  }

  async getRolePermissions(roleId: string) {
    const role = await this.rbacRepo.findRoleById(roleId);
    if (!role) throw new NotFoundException('Role not found');
    return this.rbacRepo.getRolePermissions(roleId);
  }

  async setRolePermissions(roleId: string, permissionIds: string[], grantedBy: string) {
    const role = await this.rbacRepo.findRoleById(roleId);
    if (!role) throw new NotFoundException('Role not found');
    await this.rbacRepo.setRolePermissions(roleId, permissionIds, grantedBy);
  }

  async getUserRoles(userId: string) {
    return this.rbacRepo.getUserRoles(userId);
  }

  async assignRole(data: {
    userId: string;
    roleId: string;
    branchId?: string;
    assignedBy: string;
  }) {
    return this.rbacRepo.assignUserRole(data);
  }

  async removeRole(userId: string, roleId: string) {
    return this.rbacRepo.removeUserRole(userId, roleId);
  }

  async createDefaultRoles(tenantId: string) {
    return this.rbacRepo.createDefaultRolesForTenant(tenantId);
  }
}
