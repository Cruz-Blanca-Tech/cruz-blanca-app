'use client';

import { create } from 'zustand';
import { AUTH_TOKEN_EXPIRED_EVENT } from '@/lib/api-client';
import { authService } from '../services/auth-service';
import type { AuthUser, Role } from '../types';

interface AuthState {
  user: AuthUser | null;
  role: Role | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  loginWithGoogle: (code: string) => Promise<void>;
  hydrateSession: () => Promise<void>;
  logout: () => Promise<void>;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  async loginWithGoogle(code) {
    set({ isLoading: true, error: null });
    try {
      await authService.loginWithGoogle(code);
      const user = await authService.getCurrentUser();
      set({ user, role: user.role, isLoading: false, isInitialized: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al iniciar sesión.';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  async hydrateSession() {
    if (get().isInitialized) return;
    set({ isLoading: true });
    try {
      const user = await authService.getCurrentUser();
      set({ user, role: user.role, isLoading: false, isInitialized: true });
    } catch {
      set({ user: null, role: null, isLoading: false, isInitialized: true });
    }
  },

  async logout() {
    try {
      await authService.logout();
    } finally {
      get().clearSession();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
    }
  },

  clearSession() {
    set({ user: null, role: null, error: null });
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener(AUTH_TOKEN_EXPIRED_EVENT, () => {
    useAuthStore.getState().clearSession();
  });
}
