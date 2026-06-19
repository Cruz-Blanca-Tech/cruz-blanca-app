export const ROLES = {
  ADMIN: 'admin',
  OPERATIVO: 'operativo',
  REVISOR: 'revisor',
  VISUALIZADOR: 'visualizador',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface AuthUser {
  email: string;
  full_name: string;
  role: Role;
}

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
}

export interface GoogleLoginRequest {
  google_token: string;
}
