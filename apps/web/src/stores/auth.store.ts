import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

  // Actions
  setAuth: (data: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    tenant?: TenantBranding;
  }) => void;
  setTenant: (tenant: TenantBranding) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (data: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: ({ user, accessToken, refreshToken, tenant }) =>
        set({
          user,
          tenant: tenant ?? null,
          accessToken,
          refreshToken,
          isAuthenticated: true,
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
        }),

      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
    }),
    {
      name: 'bloom-auth',
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
