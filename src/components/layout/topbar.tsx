'use client';

import { usePathname } from 'next/navigation';
import { getActiveNavItem } from '@/config/navigation';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ROLES, type Role } from '@/features/auth/types';
import { getInitials } from '@/lib/initials';

const ROLE_LABELS: Record<Role, string> = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.OPERATIVO]: 'Operativo',
  [ROLES.REVISOR]: 'Revisor',
  [ROLES.VISUALIZADOR]: 'Visualizador',
};

export function Topbar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const title = getActiveNavItem(pathname)?.label ?? 'Cruz Blanca';

  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-6">
      <h1 className="font-heading text-md font-medium text-ink-primary">{title}</h1>

      {user && (
        <div className="flex items-center gap-2 border-l border-border pl-3">
          <div className="text-right leading-tight">
            <p className="font-sans text-sm font-medium text-ink-primary">
              {user.full_name}
            </p>
            <Badge variant="secondary" className="mt-0.5 font-data">
              {ROLE_LABELS[user.role]}
            </Badge>
          </div>
          <Avatar size="lg">
            <AvatarFallback className="bg-primary font-data text-primary-foreground">
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </header>
  );
}
