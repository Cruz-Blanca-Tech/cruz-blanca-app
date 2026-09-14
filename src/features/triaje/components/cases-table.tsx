import { Inbox, OctagonAlert } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { TriageCaseListItem } from '../schemas/triage-cases-schema';
import { CaseRow } from './case-row';

interface CasesTableProps {
  cases: TriageCaseListItem[];
  isLoading: boolean;
  isError: boolean;
  /** Offset de la página actual, para numerar las filas de forma continua. */
  pageOffset: number;
}

function ListShell({ children }: { children: React.ReactNode }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {children}
    </ul>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <li key={index} className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-8 w-1/4" />
            <div className="ml-auto">
              <Skeleton className="h-9 w-24" />
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
    <li className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-12 text-center bg-slate-50/50">
      <Icon className="size-7 text-ink-muted" />
      <p className="font-sans text-sm font-medium text-ink-secondary">
        {title}
      </p>
      <p className="font-data text-xs text-ink-muted">{description}</p>
    </li>
  );
}

/** Lista de expedientes del lote con estados de carga, error y vacío. */
export function CasesTable({
  cases,
  isLoading,
  isError,
  pageOffset,
}: CasesTableProps) {
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
          title="No se pudieron cargar los expedientes"
          description="Vuelve a intentarlo en unos segundos."
        />
      </ListShell>
    );
  }

  if (cases.length === 0) {
    return (
      <ListShell>
        <MessageRow
          icon={Inbox}
          title="No hay expedientes en este lote"
          description="El lote no contiene expedientes de triaje."
        />
      </ListShell>
    );
  }

  return (
    <TooltipProvider>
      <ListShell>
        {cases.map((caseItem, index) => (
          <CaseRow
            key={caseItem.id}
            caseItem={caseItem}
            index={pageOffset + index + 1}
          />
        ))}
      </ListShell>
    </TooltipProvider>
  );
}
