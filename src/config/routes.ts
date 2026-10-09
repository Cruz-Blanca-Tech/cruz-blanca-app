import { ROLES, type Role } from '@/features/auth/types';

export const PUBLIC_ROUTES = ['/auth'] as const;

export const DEFAULT_PRIVATE_ROUTE = '/dashboard';

interface RouteAccess {
  prefix: string;
  allowedRoles: Role[];
  /** Si es true, la regla aplica solo a la ruta exacta (no a sus subrutas). */
  exact?: boolean;
}

const ALL_STAFF: Role[] = [ROLES.ADMIN, ROLES.OPERATIVO, ROLES.REVISOR, ROLES.VISUALIZADOR];
const OPERATIONS: Role[] = [ROLES.ADMIN, ROLES.OPERATIVO, ROLES.REVISOR];

/**
 * Matriz de acceso del frontend (RF-02). Espeja las políticas del backend
 * (security_access/infrastructure/api/dependencies/policies.py).
 * El orden importa: gana la primera regla que coincide.
 */

export const PRIVATE_ROUTES: RouteAccess[] = [
  {
    prefix: '/dashboard',
    allowedRoles: [ROLES.ADMIN, ROLES.OPERATIVO, ROLES.REVISOR, ROLES.VISUALIZADOR],
  },
  {
    // Listado (enmascarado para el Visualizador).
    prefix: '/beneficiarios',
    allowedRoles: ALL_STAFF,
    exact: true,
  },
  {
    // Ficha completa, alta y edición: datos personales sin enmascarar.
    prefix: '/beneficiarios',
    allowedRoles: OPERATIONS,
  },
  {
    prefix: '/carga-datos',
    allowedRoles: [ROLES.ADMIN, ROLES.OPERATIVO, ROLES.REVISOR],
  },
  {
    prefix: '/triaje',
    allowedRoles: [ROLES.ADMIN, ROLES.OPERATIVO, ROLES.REVISOR],
  },
  {
    // Exportaciones CSV con DNI y nombres.
    prefix: '/reportes',
    allowedRoles: OPERATIONS,
  },
  {
    prefix: '/usuarios',
    allowedRoles: [ROLES.ADMIN, ROLES.OPERATIVO],
  },
  {
    prefix: '/mdm',
    allowedRoles: [ROLES.ADMIN, ROLES.OPERATIVO],
  },
];

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function findRouteAccess(pathname: string): RouteAccess | undefined {
  return PRIVATE_ROUTES.find((r) =>
    r.exact
      ? pathname === r.prefix
      : pathname === r.prefix || pathname.startsWith(`${r.prefix}/`)
  );
}

export function canAccess(pathname: string, role: Role | null): boolean {
  if (!role) return false;
  const route = findRouteAccess(pathname);
  if (!route) return true;
  return route.allowedRoles.includes(role);
}
