'use client';

import { useAuthStore } from '../stores/auth-store';
import { ROLES } from '../types';

/**
 * Indica si el usuario autenticado tiene rol admin.
 * Útil para mostrar/ocultar acciones restringidas (p. ej. crear actividades,
 * que en el backend exige ALLOW_ADMIN_ONLY).
 */
export function useIsAdmin(): boolean {
  return useAuthStore((s) => s.role === ROLES.ADMIN);
}
