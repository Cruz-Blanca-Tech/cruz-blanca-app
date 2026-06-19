'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cross, LogOut } from 'lucide-react';
import { getNavItemsForRole } from '@/config/navigation';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const items = getNavItemsForRole(role);

  return (
    <aside className="flex w-60 shrink-0 flex-col overflow-y-auto bg-sidebar text-sidebar-foreground shadow-sidebar">
      <div className="flex items-center gap-2.5 border-b border-sidebar-border px-4 py-5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-overlay-white15">
          <Cross className="size-5" strokeWidth={2.5} aria-hidden />
        </div>
        <div className="leading-tight">
          <p className="font-heading text-sm font-bold">Cruz Blanca</p>
          <span className="block text-[9px] tracking-wide text-overlay-white60">
            Sistema de Gestión
          </span>
        </div>
      </div>

      <nav className="flex flex-col py-3.5">
        {items.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 border-l-[3px] px-4 py-2.5 font-sans text-sm transition-colors',
                active
                  ? 'border-l-sidebar-primary bg-sidebar-accent font-medium text-sidebar-foreground'
                  : 'border-l-transparent text-overlay-white82 hover:bg-overlay-white08'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-sidebar-border pt-2.5">
        <p className="px-4 pb-2 font-data text-[10px] text-overlay-white40">
          v1.0.0 · Abril 2026
        </p>
        <button
          type="button"
          onClick={() => logout()}
          className="flex w-full items-center gap-2.5 border-l-[3px] border-l-transparent px-4 py-2.5 font-sans text-sm text-overlay-white82 transition-colors hover:bg-overlay-white08"
        >
          <LogOut className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
