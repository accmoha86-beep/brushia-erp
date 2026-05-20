'use client';

import { usePermissions } from '@/hooks/use-permissions';

interface PermissionGateProps {
  children: React.ReactNode;
  permissions: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children based on user permissions.
 * 
 * Usage:
 * ```tsx
 * <PermissionGate permissions={['inventory.stock.adjust']}>
 *   <AdjustStockButton />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  children,
  permissions,
  requireAll = true,
  fallback = null,
}: PermissionGateProps) {
  const { canAny, canAll } = usePermissions();

  const hasAccess = requireAll
    ? canAll(...permissions)
    : canAny(...permissions);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
