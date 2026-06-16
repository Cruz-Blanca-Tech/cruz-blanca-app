'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getNavItemsForRole } from '@/config/navigation';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.role);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const items = getNavItemsForRole(role);

  return (
    <aside className="flex w-64 flex-col border-r border-zinc-200 bg-white">
      <div className="px-6 py-6">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
          Cruz Blanca
        </h2>
        {user && (
          <p className="mt-1 text-xs text-zinc-500">
            {user.full_name}
            <span className="ml-1 text-zinc-400">({user.role})</span>
          </p>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-700 hover:bg-zinc-100'
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-200 p-3">
        <button
          type="button"
          onClick={() => logout()}
          className="w-full rounded-md px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
