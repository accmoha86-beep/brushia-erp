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

interface AuthState {
  // State
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (data: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (data: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: ({ user, accessToken, refreshToken }) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      clearAuth: () =>
        set({
          user: null,
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
      name: 'brushia-auth',
      partialize: (state) => ({
        // Only persist tokens and user — rehydrate on app load
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
