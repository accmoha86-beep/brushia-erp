import { useAuthStore } from '@/stores/auth.store';
import { useCallback, useMemo } from 'react';

/**
 * Hook for checking user permissions.
 * 
 * Usage:
 * ```tsx
 * const { can, canAny, canAll } = usePermissions();
 * 
 * if (can('inventory.stock.adjust')) {
 *   // Show adjust button
 * }
 * 
 * if (canAll('accounting.journals.create', 'accounting.journals.post')) {
 *   // Show post journal button
 * }
 * ```
 */
export function usePermissions() {
  const permissions = useAuthStore((s) => s.user?.permissions ?? []);
  const permissionSet = useMemo(() => new Set(permissions), [permissions]);

  const can = useCallback(
    (permission: string) => permissionSet.has(permission),
    [permissionSet],
  );

  const canAny = useCallback(
    (...perms: string[]) => perms.some((p) => permissionSet.has(p)),
    [permissionSet],
  );

  const canAll = useCallback(
    (...perms: string[]) => perms.every((p) => permissionSet.has(p)),
    [permissionSet],
  );

  return { can, canAny, canAll, permissions };
}
