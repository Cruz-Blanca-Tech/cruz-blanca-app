/**
 * Tipos puros del feature auth. Los SCHEMAS Zod del dominio (roles y usuario
 * autenticado, validados en runtime) viven en `../schemas/auth-schema`; se
 * re-exportan aquí para no romper los importadores existentes de `auth/types`.
 */
export {
  ROLES,
  roleSchema,
  authUserSchema,
  type Role,
  type AuthUser,
} from '../schemas/auth-schema';

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
}

export interface GoogleLoginRequest {
  google_token: string;
}
