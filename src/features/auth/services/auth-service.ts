import axios from 'axios';
import { apiClient } from '@/lib/api-client';
import { parseApiResponse } from '@/lib/parse-api-response';
import { authUserSchema, type AuthUser } from '../types';

const authAxios = axios.create({
  baseURL: '/api/auth',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export const authService = {
  async loginWithGoogle(code: string): Promise<void> {
    await authAxios.post('/google/callback', { code });
  },

  async logout(): Promise<void> {
    await authAxios.post('/logout');
  },

  async getCurrentUser(): Promise<AuthUser> {
    const data = await apiClient.get('/auth/users/me');
    return parseApiResponse(authUserSchema, data, 'el usuario autenticado');
  },
};
