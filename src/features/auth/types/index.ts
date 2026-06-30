import { z } from 'zod';

export const ROLES = {
  ADMIN: 'admin',
  OPERATIVO: 'operativo',
  REVISOR: 'revisor',
  VISUALIZADOR: 'visualizador',
} as const;

/** Roles válidos del backend. Es la frontera de confianza para los permisos. */
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

/**
 * Usuario autenticado (GET /auth/users/me). Se valida en runtime porque su
 * `role` gobierna la UI de permisos: un valor inesperado debe fallar de forma
 * explícita, no degradar en silencio.
 */
export const authUserSchema = z.object({
  email: z.string(),
  full_name: z.string(),
  role: roleSchema,
});
export type AuthUser = z.infer<typeof authUserSchema>;

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
}

export interface GoogleLoginRequest {
  google_token: string;
}
