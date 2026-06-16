import axios from 'axios';
import { apiClient } from '@/lib/api-client';
import type { AuthUser } from '../types';

const authAxios = axios.create({
  baseURL: '/api/auth',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export const authService = {
  async loginWithGoogle(googleIdToken: string): Promise<void> {
    await authAxios.post('/google/callback', { google_token: googleIdToken });
  },

  async logout(): Promise<void> {
    await authAxios.post('/logout');
  },

  async getCurrentUser(): Promise<AuthUser> {
    return apiClient.get<AuthUser>('/security/me');
  },
};
