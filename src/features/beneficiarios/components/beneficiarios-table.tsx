import { OctagonAlert, Users } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { BeneficiarySummary } from '../schemas/beneficiaries-list-schema';
import { BeneficiarioRow } from './beneficiario-row';

interface BeneficiariosTableProps {
  beneficiaries: BeneficiarySummary[];
  isLoading: boolean;
  isError: boolean;
  /** El rol Visualizador enmascara nombre y DNI. */
  masked: boolean;
}

const COLUMNS = [
  { label: 'Nombre completo', className: '' },
  { label: 'DNI', className: '' },
  { label: 'Edad', className: 'text-center' },
  { label: 'Género', className: '' },
  { label: 'Grado', className: '' },
  { label: 'Acciones', className: 'text-right' },
] as const;

const HEAD_CLASSNAME =
  'h-auto bg-slate-50 px-4 py-3 font-data text-[10.5px] font-semibold tracking-wider text-ink-secondary uppercase';

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {COLUMNS.map((column) => (
            <TableHead
              key={column.label}
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
      {Array.from({ length: 8 }).map((_, index) => (
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
          <p className="font-sans text-sm font-medium text-ink-secondary">
            {title}
          </p>
          <p className="font-data text-xs text-ink-muted">{description}</p>
        </div>
      </TableCell>
    </TableRow>
  );
}

/** Tabla de beneficiarios con estados de carga, error y vacío. */
export function BeneficiariosTable({
  beneficiaries,
  isLoading,
  isError,
  masked,
}: BeneficiariosTableProps) {
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
          title="No se pudieron cargar los beneficiarios"
          description="Vuelve a intentarlo en unos segundos."
        />
      </TableShell>
    );
  }

  if (beneficiaries.length === 0) {
    return (
      <TableShell>
        <MessageRow
          icon={Users}
          title="No hay beneficiarios para mostrar"
          description="Cuando se registren beneficiarios aparecerán aquí."
        />
      </TableShell>
    );
  }

  return (
    <TableShell>
      {beneficiaries.map((beneficiary) => (
        <BeneficiarioRow
          key={beneficiary.id}
          beneficiary={beneficiary}
          masked={masked}
        />
      ))}
    </TableShell>
  );
}
