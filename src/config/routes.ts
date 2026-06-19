import { ROLES, type Role } from '@/features/auth/types';

export const PUBLIC_ROUTES = ['/auth'] as const;

export const DEFAULT_PRIVATE_ROUTE = '/dashboard';

interface RouteAccess {
  prefix: string;
  allowedRoles: Role[];
}

export const PRIVATE_ROUTES: RouteAccess[] = [
  {
    prefix: '/dashboard',
    allowedRoles: [ROLES.ADMIN, ROLES.OPERATIVO, ROLES.REVISOR, ROLES.VISUALIZADOR],
  },
  {
    prefix: '/beneficiarios',
    allowedRoles: [ROLES.ADMIN, ROLES.OPERATIVO, ROLES.REVISOR, ROLES.VISUALIZADOR],
  },
  {
    prefix: '/carga-datos',
    allowedRoles: [ROLES.ADMIN, ROLES.OPERATIVO, ROLES.REVISOR],
  },
  {
    prefix: '/reportes',
    allowedRoles: [ROLES.ADMIN, ROLES.OPERATIVO, ROLES.REVISOR, ROLES.VISUALIZADOR],
  },
  {
    prefix: '/usuarios',
    allowedRoles: [ROLES.ADMIN, ROLES.OPERATIVO],
  },
];

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function findRouteAccess(pathname: string): RouteAccess | undefined {
  return PRIVATE_ROUTES.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`)
  );
}

export function canAccess(pathname: string, role: Role | null): boolean {
  if (!role) return false;
  const route = findRouteAccess(pathname);
  if (!route) return true;
  return route.allowedRoles.includes(role);
}
