import { Inbox, OctagonAlert } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { BatchListItem } from '../schemas/batches-list-schema';
import { BatchRow } from './batch-row';

interface BatchesTableProps {
  batches: BatchListItem[];
  isLoading: boolean;
  isError: boolean;
  /** Hay filtros activos: ajusta el mensaje del estado vacío. */
  hasFilters: boolean;
}

function ListShell({ children }: { children: React.ReactNode }) {
  return (
    <ul className="flex flex-col gap-3">
      {children}
    </ul>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <li key={index} className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-1/4" />
            <Skeleton className="h-12 w-1/4" />
            <Skeleton className="h-12 w-1/4" />
            <div className="ml-auto">
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </li>
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
    <li className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-12 text-center bg-slate-50/50">
      <Icon className="size-7 text-ink-muted" />
      <p className="font-sans text-sm font-medium text-ink-secondary">
        {title}
      </p>
      <p className="font-data text-xs text-ink-muted">{description}</p>
    </li>
  );
}

/** Lista de lotes con estados de carga, error y vacío. */
export function BatchesTable({
  batches,
  isLoading,
  isError,
  hasFilters,
}: BatchesTableProps) {
  if (isLoading) {
    return (
      <ListShell>
        <LoadingRows />
      </ListShell>
    );
  }

  if (isError) {
    return (
      <ListShell>
        <MessageRow
          icon={OctagonAlert}
          title="No se pudieron cargar los lotes"
          description="Vuelve a intentarlo en unos segundos."
        />
      </ListShell>
    );
  }

  if (batches.length === 0) {
    return (
      <ListShell>
        <MessageRow
          icon={Inbox}
          title="No hay lotes para mostrar"
          description={
            hasFilters
              ? 'No hay lotes que coincidan con los filtros.'
              : 'Cuando cargues un lote aparecerá aquí.'
          }
        />
      </ListShell>
    );
  }

  return (
    <TooltipProvider>
      <ListShell>
        {batches.map((batch) => (
          <BatchRow key={batch.id} batch={batch} />
        ))}
      </ListShell>
    </TooltipProvider>
  );
}
