import type { VariantProps } from 'class-variance-authority';

import { badgeVariants } from '@/components/ui/badge';
import { ROLES, type Role } from '@/features/auth/types';

/** Variante válida del `Badge` (sin el `null`/`undefined` del tipo de cva). */
type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

export interface RoleConfig {
  role: Role;
  /** Etiqueta legible en español (badge de la tabla y opción del selector). */
  label: string;
  /** Descripción corta del rol (subtítulo de la opción del selector). */
  description: string;
  /** Variante base del `Badge`; el color fino se afina con `badgeClassName`. */
  badgeVariant: BadgeVariant;
  /** Color del badge con tokens del design system (nunca hex). */
  badgeClassName: string;
  /** Paleta del avatar (fondo + texto) con tokens del design system. */
  avatarClassName: string;
}

/**
 * Config visual por rol (los 4 roles del backend). Reutiliza las claves de
 * `ROLES` de auth como fuente de verdad; los colores salen solo de tokens de
 * `globals.css`, al estilo de `triage-verdict-config.ts`.
 */
export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  [ROLES.ADMIN]: {
    role: ROLES.ADMIN,
    label: 'Administrador',
    description: 'Acceso total al sistema, incluida la gestión de usuarios.',
    badgeVariant: 'default',
    badgeClassName: '',
    avatarClassName: 'bg-brand-200 text-brand-dark',
  },
  [ROLES.OPERATIVO]: {
    role: ROLES.OPERATIVO,
    label: 'Operativo',
    description: 'Carga, corrige y gestiona registros y lotes.',
    badgeVariant: 'secondary',
    badgeClassName: 'bg-warning-light text-warning-dark',
    avatarClassName: 'bg-warning-light text-warning-dark',
  },
  [ROLES.REVISOR]: {
    role: ROLES.REVISOR,
    label: 'Revisor',
    description: 'Revisa y aprueba expedientes en el triaje.',
    badgeVariant: 'secondary',
    badgeClassName: 'bg-info-light text-info-dark',
    avatarClassName: 'bg-info-light text-info-dark',
  },
  [ROLES.VISUALIZADOR]: {
    role: ROLES.VISUALIZADOR,
    label: 'Visualizador',
    description: 'Solo consulta de datos y reportes.',
    badgeVariant: 'secondary',
    badgeClassName: 'bg-slate-100 text-ink-secondary',
    avatarClassName: 'bg-slate-100 text-ink-secondary',
  },
};

/** Config de los roles en orden estable (para selectores y contadores). */
export const ROLE_LIST: RoleConfig[] = [
  ROLES.ADMIN,
  ROLES.OPERATIVO,
  ROLES.REVISOR,
  ROLES.VISUALIZADOR,
].map((role) => ROLE_CONFIG[role]);
