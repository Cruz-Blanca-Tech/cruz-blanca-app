import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Role } from '@/features/auth/types';

import { ROLE_CONFIG } from '../lib/role-config';
import { getInitials } from '../lib/user-format';

interface UserAvatarProps {
  fullName: string;
  role: Role;
  /** Tamaño del avatar de shadcn (por defecto el mediano de la tabla). */
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

/**
 * Avatar de iniciales con la paleta (fondo + texto) correspondiente al rol,
 * tomada de `ROLE_CONFIG` (solo tokens del design system).
 */
export function UserAvatar({
  fullName,
  role,
  size = 'default',
  className,
}: UserAvatarProps) {
  return (
    <Avatar size={size} className={className}>
      <AvatarFallback
        className={cn('font-data font-medium', ROLE_CONFIG[role].avatarClassName)}
      >
        {getInitials(fullName)}
      </AvatarFallback>
    </Avatar>
  );
}
