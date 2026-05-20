'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requireAll?: boolean; // true = AND, false = OR (default: AND)
}

/**
 * Wraps protected pages to enforce authentication and authorization.
 * 
 * Usage:
 * ```tsx
 * <ProtectedRoute requiredPermissions={['inventory.stock.read']}>
 *   <InventoryPage />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  requiredPermissions = [],
  requireAll = true,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-rose-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Check permissions
  if (requiredPermissions.length > 0) {
    const perms = new Set(user.permissions);
    const hasAccess = requireAll
      ? requiredPermissions.every((p) => perms.has(p))
      : requiredPermissions.some((p) => perms.has(p));

    if (!hasAccess) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400 text-sm">
              You don&apos;t have permission to access this page.
            </p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
