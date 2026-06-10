import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl?: string;
  language: string;
  theme: string;
  permissions: string[];
}

export interface TenantBranding {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  tagline?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  governorate?: string | null;
  invoiceHeader?: string | null;
  invoiceFooter?: string | null;
  receiptHeader?: string | null;
  receiptFooter?: string | null;
  socialInstagram?: string | null;
  socialFacebook?: string | null;
}

interface AuthState {
  // State
  user: AuthUser | null;
  tenant: TenantBranding | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  rememberMe: boolean;

  // Actions
  setAuth: (data: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    tenant?: TenantBranding;
    rememberMe?: boolean;
  }) => void;
  setTenant: (tenant: TenantBranding) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (data: Partial<AuthUser>) => void;
}

// Custom storage that switches between localStorage and sessionStorage
const hybridStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    // Check localStorage first (remember me), then sessionStorage
    return localStorage.getItem(name) ?? sessionStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      const parsed = JSON.parse(value);
      const rememberMe = parsed?.state?.rememberMe ?? true;
      if (rememberMe) {
        localStorage.setItem(name, value);
        sessionStorage.removeItem(name);
      } else {
        sessionStorage.setItem(name, value);
        localStorage.removeItem(name);
      }
    } catch {
      localStorage.setItem(name, value);
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      rememberMe: true,

      setAuth: ({ user, accessToken, refreshToken, tenant, rememberMe }) =>
        set({
          user,
          tenant: tenant ?? null,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          rememberMe: rememberMe ?? true,
        }),

      setTenant: (tenant) => set({ tenant }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      clearAuth: () =>
        set({
          user: null,
          tenant: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          rememberMe: true,
        }),

      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
    }),
    {
      name: 'bloom-auth',
      storage: createJSONStorage(() => hybridStorage),
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        rememberMe: state.rememberMe,
      }),
    },
  ),
);
