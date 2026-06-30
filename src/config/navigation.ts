import {
  Home,
  Users,
  Upload,
  Inbox,
  BarChart3,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import { ROLES, type Role } from '@/features/auth/types';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  allowedRoles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Inicio',
    href: '/dashboard',
    icon: Home,
    allowedRoles: [ROLES.ADMIN, ROLES.OPERATIVO, ROLES.REVISOR, ROLES.VISUALIZADOR],
  },
  {
    label: 'Beneficiarios',
    href: '/beneficiarios',
    icon: Users,
    allowedRoles: [ROLES.ADMIN, ROLES.OPERATIVO, ROLES.REVISOR, ROLES.VISUALIZADOR],
  },
  {
    label: 'Carga de datos',
    href: '/carga-datos',
    icon: Upload,
    allowedRoles: [ROLES.ADMIN, ROLES.OPERATIVO, ROLES.REVISOR],
  },
  {
    label: 'Triaje',
    href: '/triaje',
    icon: Inbox,
    allowedRoles: [ROLES.ADMIN, ROLES.OPERATIVO, ROLES.REVISOR],
  },
  {
    label: 'Reportes',
    href: '/reportes',
    icon: BarChart3,
    allowedRoles: [ROLES.ADMIN, ROLES.OPERATIVO, ROLES.REVISOR, ROLES.VISUALIZADOR],
  },
  {
    label: 'Usuarios',
    href: '/usuarios',
    icon: UserCog,
    allowedRoles: [ROLES.ADMIN, ROLES.OPERATIVO],
  },
];

export function getNavItemsForRole(role: Role | null): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter((item) => item.allowedRoles.includes(role));
}

export function getActiveNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
}
