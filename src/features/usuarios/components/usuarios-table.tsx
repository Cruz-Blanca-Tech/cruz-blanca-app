import { Lock, OctagonAlert, Pencil, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { ROLE_CONFIG } from '../lib/role-config';
import type { User } from '../schemas/user-schema';
import { UserAvatar } from './user-avatar';

interface UsuariosTableProps {
  users: User[];
  isLoading: boolean;
  isError: boolean;
  /** Solo un administrador puede cambiar roles; si no, la acción va bloqueada. */
  canEditRole: boolean;
  onEditRole: (user: User) => void;
}

const COLUMNS = [
  { label: '', className: 'w-14' },
  { label: 'Nombre', className: '' },
  { label: 'Email', className: '' },
  { label: 'Rol', className: '' },
  { label: 'Acciones', className: 'text-right' },
] as const;

const HEAD_CLASSNAME =
  'h-auto bg-slate-50 px-4 py-3 font-data text-[10.5px] font-semibold tracking-wider text-ink-secondary uppercase';

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {COLUMNS.map((column, index) => (
            <TableHead
              key={column.label || `col-${index}`}
              className={`${HEAD_CLASSNAME} ${column.className}`}
            >
              {column.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>{children}</TableBody>
    </Table>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <TableRow key={index} className="hover:bg-transparent">
          {Array.from({ length: COLUMNS.length }).map((__, cell) => (
            <TableCell key={cell} className="px-4 py-3.5">
              <Skeleton className="h-5 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function MessageRow({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Users;
  title: string;
  description: string;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={COLUMNS.length} className="px-5 py-12">
        <div className="flex flex-col items-center gap-2 text-center">
          <Icon className="size-7 text-ink-muted" />
          <p className="font-sans text-sm font-medium text-ink-secondary">{title}</p>
          <p className="font-data text-xs text-ink-muted">{description}</p>
        </div>
      </TableCell>
    </TableRow>
  );
}

/** Acción "Editar rol"; bloqueada con candado + tooltip para no-administradores. */
function EditRoleAction({
  user,
  canEditRole,
  onEditRole,
}: {
  user: User;
  canEditRole: boolean;
  onEditRole: (user: User) => void;
}) {
  if (canEditRole) {
    return (
      <Button size="sm" variant="outline" onClick={() => onEditRole(user)}>
        <Pencil />
        Editar rol
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          // El `span` envuelve el botón deshabilitado para que el tooltip siga
          // recibiendo los eventos de hover (un botón `disabled` no los emite).
          <span className="inline-flex" />
        }
      >
        <Button size="sm" variant="outline" disabled>
          <Lock />
          Editar rol
        </Button>
      </TooltipTrigger>
      <TooltipContent>Solo un administrador puede cambiar roles</TooltipContent>
    </Tooltip>
  );
}

/** Una fila de la tabla de usuarios. */
function UserRow({
  user,
  canEditRole,
  onEditRole,
}: {
  user: User;
  canEditRole: boolean;
  onEditRole: (user: User) => void;
}) {
  const config = ROLE_CONFIG[user.role];

  return (
    <TableRow>
      {/* Avatar de iniciales */}
      <TableCell className="px-4 py-3 pr-0 align-middle">
        <UserAvatar fullName={user.full_name} role={user.role} />
      </TableCell>

      {/* Nombre */}
      <TableCell className="px-4 py-3 align-middle font-sans text-sm font-medium text-ink-primary">
        {user.full_name}
      </TableCell>

      {/* Email */}
      <TableCell className="px-4 py-3 align-middle font-data text-[12.5px] text-ink-secondary">
        {user.email}
      </TableCell>

      {/* Rol */}
      <TableCell className="px-4 py-3 align-middle">
        <Badge variant={config.badgeVariant} className={config.badgeClassName}>
          {config.label}
        </Badge>
      </TableCell>

      {/* Acciones */}
      <TableCell className="px-4 py-3 text-right align-middle">
        <EditRoleAction
          user={user}
          canEditRole={canEditRole}
          onEditRole={onEditRole}
        />
      </TableCell>
    </TableRow>
  );
}

/** Tabla de usuarios con estados de carga, error y vacío. */
export function UsuariosTable({
  users,
  isLoading,
  isError,
  canEditRole,
  onEditRole,
}: UsuariosTableProps) {
  if (isLoading) {
    return (
      <TableShell>
        <LoadingRows />
      </TableShell>
    );
  }

  if (isError) {
    return (
      <TableShell>
        <MessageRow
          icon={OctagonAlert}
          title="No se pudieron cargar los usuarios"
          description="Vuelve a intentarlo en unos segundos."
        />
      </TableShell>
    );
  }

  if (users.length === 0) {
    return (
      <TableShell>
        <MessageRow
          icon={Users}
          title="No hay usuarios para mostrar"
          description="Prueba a ajustar la búsqueda o el filtro por rol."
        />
      </TableShell>
    );
  }

  return (
    <TooltipProvider>
      <TableShell>
        {users.map((user) => (
          <UserRow
            key={user.id}
            user={user}
            canEditRole={canEditRole}
            onEditRole={onEditRole}
          />
        ))}
      </TableShell>
    </TooltipProvider>
  );
}
