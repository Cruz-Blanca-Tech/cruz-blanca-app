'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIsAdmin } from '@/features/auth/hooks/use-permissions';
import { roleSchema, type Role } from '@/features/auth/types';

import { useUsers } from '../hooks/use-usuarios-queries';
import { ROLE_LIST } from '../lib/role-config';
import type { User } from '../schemas/user-schema';
import { UsuariosTable } from './usuarios-table';
import { EditRoleDialog } from './edit-role-dialog';

/** Valor sentinela de la opción "Todos los roles" (los roles reales no colisionan). */
const ALL_ROLES = '__all__';

/** Construye el subtítulo con los contadores reales: total + conteo por rol. */
function buildSubtitle(users: User[]): string {
  const total = users.length;
  const totalLabel = `${total} usuario${total === 1 ? '' : 's'} en total`;
  const breakdown = ROLE_LIST.map((config) => {
    const count = users.filter((u) => u.role === config.role).length;
    return `${config.label}: ${count}`;
  }).join(' · ');
  return `${totalLabel} · ${breakdown}`;
}

/** Orquestador de la pantalla de Usuarios (ruta /usuarios). */
export function UsuariosScreen() {
  const canEditRole = useIsAdmin();
  const { data, isLoading, isError } = useUsers();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const users = useMemo(() => data ?? [], [data]);

  // Búsqueda (nombre/email) + filtro por rol, ambos client-side sobre la lista
  // completa que devuelve el endpoint (no pagina ni filtra en servidor).
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchSearch =
        !query ||
        user.full_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);
      const matchRole = !roleFilter || user.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const hasData = !isLoading && !isError;

  // base-ui usa `items` (value → label) para que el trigger muestre la etiqueta
  // legible del rol en vez del valor crudo del enum.
  const roleItems = [
    { value: ALL_ROLES, label: 'Todos los roles' },
    ...ROLE_LIST.map((config) => ({ value: config.role, label: config.label })),
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      {/* Encabezado */}
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-ink-primary">
          Usuarios
        </h1>
        <p className="mt-0.5 font-sans text-sm text-ink-muted">
          {hasData
            ? buildSubtitle(users)
            : 'Gestión de cuentas y permisos del sistema'}
        </p>
      </header>

      {/* Tabla + toolbar en una sola tarjeta */}
      <Card className="gap-0 overflow-hidden p-0 ring-border">
        {/* Toolbar: búsqueda + filtro por rol + contador de resultados */}
        <div className="flex flex-wrap items-center gap-2.5 border-b border-border p-3.5">
          <div className="relative min-w-0 flex-1 sm:max-w-90">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-muted" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o email…"
              aria-label="Buscar usuarios por nombre o email"
              className="pl-8.5"
              disabled={!hasData}
            />
          </div>

          <Select
            value={roleFilter ?? ALL_ROLES}
            onValueChange={(next) =>
              setRoleFilter(next === ALL_ROLES ? null : roleSchema.parse(next))
            }
            items={roleItems}
            disabled={!hasData}
          >
            <SelectTrigger className="h-9 min-w-45" aria-label="Filtrar por rol">
              <SelectValue placeholder="Todos los roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ROLES}>Todos los roles</SelectItem>
              {ROLE_LIST.map((config) => (
                <SelectItem key={config.role} value={config.role}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasData && (
            <span className="ml-auto font-data text-xs text-ink-muted">
              {filtered.length} resultado{filtered.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        <UsuariosTable
          users={filtered}
          isLoading={isLoading}
          isError={isError}
          canEditRole={canEditRole}
          onEditRole={setEditingUser}
        />
      </Card>

      {editingUser && (
        <EditRoleDialog
          user={editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}
