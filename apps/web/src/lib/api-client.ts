/**
 * API Client with automatic token refresh.
 * 
 * Features:
 * - Automatic Bearer token injection
 * - Token refresh on 401
 * - Request queue during refresh
 * - Correlation ID forwarding
 * - Tenant ID header
 */

import { useAuthStore } from '@/stores/auth.store';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/v1';

// Track if we're currently refreshing to prevent parallel refreshes
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeToRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshComplete(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();

  if (!refreshToken) {
    clearAuth();
    return null;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearAuth();
      return null;
    }

    const data = await response.json();
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    clearAuth();
    return null;
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown,
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

function getAuthFromStorage(): { accessToken: string | null; tenantId: string | null } {
  if (typeof window === 'undefined') return { accessToken: null, tenantId: null };
  try {
    const raw = localStorage.getItem('brushia-auth');
    if (!raw) return { accessToken: null, tenantId: null };
    const parsed = JSON.parse(raw);
    return {
      accessToken: parsed?.state?.accessToken || null,
      tenantId: parsed?.state?.user?.tenantId || null,
    };
  } catch {
    return { accessToken: null, tenantId: null };
  }
}

export async function apiClient<T = unknown>(
  path: string,
  options: RequestInit & {
    params?: Record<string, string | number | boolean | undefined>;
  } = {},
): Promise<T> {
  const storeState = useAuthStore.getState();
  // Zustand persist rehydrates async — fallback to direct localStorage read
  const fallback = (!storeState.accessToken) ? getAuthFromStorage() : null;
  const accessToken = storeState.accessToken || fallback?.accessToken || null;
  const user = storeState.user || (fallback?.tenantId ? { tenantId: fallback.tenantId } : null);

  // Build URL with query params
  const fullPath = path.startsWith('/') ? API_BASE + path : API_BASE + '/' + path;
  const url = new URL(fullPath);
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (user?.tenantId) {
    headers['X-Tenant-Id'] = user.tenantId;
  }

  // Generate correlation ID for tracing
  headers['X-Correlation-Id'] = crypto.randomUUID();

  const response = await fetch(url.toString(), {
    ...options,
    headers,
  });

  // Handle 401 — attempt token refresh
  if (response.status === 401 && accessToken) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;

      if (newToken) {
        onRefreshComplete(newToken);
        // Retry original request with new token
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryResponse = await fetch(url.toString(), {
          ...options,
          headers,
        });

        if (!retryResponse.ok) {
          throw new ApiError(retryResponse.status, retryResponse.statusText);
        }

        return retryResponse.json();
      } else {
        // Refresh failed — redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        throw new ApiError(401, 'Session expired');
      }
    } else {
      // Another request is already refreshing — wait for it
      return new Promise<T>((resolve, reject) => {
        subscribeToRefresh(async (newToken) => {
          headers['Authorization'] = `Bearer ${newToken}`;
          try {
            const retryResponse = await fetch(url.toString(), {
              ...options,
              headers,
            });
            resolve(retryResponse.json());
          } catch (err) {
            reject(err);
          }
        });
      });
    }
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const msg = (data as any)?.message || (data as any)?.errors?.map((e: any) => e.message || e.field).join(', ') || response.statusText || 'Request failed';
    throw new ApiError(response.status, msg, data);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Convenience methods
export const api = {
  get: <T>(path: string, params?: Record<string, string | number | boolean | undefined>) =>
    apiClient<T>(path, { method: 'GET', params }),

  post: <T>(path: string, body?: unknown) =>
    apiClient<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown) =>
    apiClient<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    apiClient<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = void>(path: string) =>
    apiClient<T>(path, { method: 'DELETE' }),
};
