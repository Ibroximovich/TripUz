import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthTokens, UserRole, AuthState } from '../types/auth';
import { logoutApi } from '../services/auth.api';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      selectedRole: 'TOURIST',

      setSelectedRole: (role: UserRole) =>
        set({
          selectedRole: role,
        }),

      setAuth: (user: User, tokens: AuthTokens) =>
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
        }),

      /** Update only the tokens (called by silent refresh interceptor) */
      setTokens: (accessToken: string, refreshToken: string) =>
        set({
          accessToken,
          refreshToken,
        }),

      updateUser: (user: User) =>
        set((state) => ({
          ...state,
          user,
        })),

      /** Revoke token server-side, then clear local state */
      logout: () => {
        const currentRefreshToken = get().refreshToken;
        if (currentRefreshToken) {
          logoutApi(currentRefreshToken); // fire-and-forget
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'tripuz_auth_storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
