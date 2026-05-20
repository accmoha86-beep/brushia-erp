import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'required_permissions';

/**
 * Require specific permissions to access a route.
 * 
 * Usage:
 * ```
 * @RequirePermissions('inventory.stock.adjust', 'inventory.movements.read')
 * @Get('stock')
 * getStock() { ... }
 * ```
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
