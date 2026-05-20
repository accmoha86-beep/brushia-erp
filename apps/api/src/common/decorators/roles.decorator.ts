import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@brushia/shared';

export const ROLES_KEY = 'roles';

/**
 * Restrict endpoint access to specific roles.
 * Usage: @Roles('tenant_admin', 'manager')
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
