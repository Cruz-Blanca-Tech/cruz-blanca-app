import { Inbox, OctagonAlert } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { BatchListItem } from '../schemas/batches-list-schema';
import { BatchRow } from './batch-row';

interface BatchesTableProps {
  batches: BatchListItem[];
  isLoading: boolean;
  isError: boolean;
  /** Hay filtros activos: ajusta el mensaje del estado vacío. */
  hasFilters: boolean;
}

const COLUMNS = [
  'Fecha de carga',
  'Programa',
  'Actividad / descripción',
  'Archivos',
  'Desglose de expedientes',
  'Estado',
] as const;

const HEAD_CLASSNAME =
  'h-auto bg-slate-50 px-4 py-3 font-data text-[10.5px] font-semibold tracking-wider text-ink-secondary uppercase';

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <Card className="gap-0 p-0 ring-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {COLUMNS.map((column) => (
              <TableHead key={column} className={HEAD_CLASSNAME}>
                {column}
              </TableHead>
            ))}
            <TableHead className={`${HEAD_CLASSNAME} text-right`}>
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </Card>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <TableRow key={index} className="hover:bg-transparent">
          {Array.from({ length: 7 }).map((__, cell) => (
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
  icon: typeof Inbox;
  title: string;
  description: string;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={7} className="px-5 py-12">
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

/** Tabla de lotes con estados de carga, error y vacío. */
export function BatchesTable({
  batches,
  isLoading,
  isError,
  hasFilters,
}: BatchesTableProps) {
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
          title="No se pudieron cargar los lotes"
          description="Vuelve a intentarlo en unos segundos."
        />
      </TableShell>
    );
  }

  if (batches.length === 0) {
    return (
      <TableShell>
        <MessageRow
          icon={Inbox}
          title="No hay lotes para mostrar"
          description={
            hasFilters
              ? 'No hay lotes que coincidan con los filtros.'
              : 'Cuando cargues un lote aparecerá aquí.'
          }
        />
      </TableShell>
    );
  }

  return (
    <TableShell>
      {batches.map((batch) => (
        <BatchRow key={batch.id} batch={batch} />
      ))}
    </TableShell>
  );
}
