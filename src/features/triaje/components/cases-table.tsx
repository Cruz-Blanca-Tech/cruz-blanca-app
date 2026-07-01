import { Inbox, OctagonAlert } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TriageCaseListItem } from '../schemas/triage-cases-schema';
import { CaseRow } from './case-row';

interface CasesTableProps {
  cases: TriageCaseListItem[];
  isLoading: boolean;
  isError: boolean;
  /** Offset de la página actual, para numerar las filas de forma continua. */
  pageOffset: number;
}

const COLUMNS = [
  { label: '#', className: 'w-12 text-right' },
  { label: 'DNI de referencia', className: '' },
  { label: 'Errores', className: '' },
  { label: 'Observaciones', className: '' },
  { label: 'Discrepancias', className: '' },
  { label: 'Veredicto', className: '' },
] as const;

const HEAD_CLASSNAME =
  'h-auto bg-slate-50 px-4 py-3 font-data text-[10.5px] font-semibold tracking-wider text-ink-secondary uppercase';

const COL_COUNT = COLUMNS.length + 1;

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <Card className="gap-0 overflow-hidden p-0 ring-border">
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
      {Array.from({ length: 8 }).map((_, index) => (
        <TableRow key={index} className="hover:bg-transparent">
          {Array.from({ length: COL_COUNT }).map((__, cell) => (
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
      <TableCell colSpan={COL_COUNT} className="px-5 py-12">
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

/** Tabla de expedientes del lote con estados de carga, error y vacío. */
export function CasesTable({
  cases,
  isLoading,
  isError,
  pageOffset,
}: CasesTableProps) {
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
          title="No se pudieron cargar los expedientes"
          description="Vuelve a intentarlo en unos segundos."
        />
      </TableShell>
    );
  }

  if (cases.length === 0) {
    return (
      <TableShell>
        <MessageRow
          icon={Inbox}
          title="No hay expedientes en este lote"
          description="El lote no contiene expedientes de triaje."
        />
      </TableShell>
    );
  }

  return (
    <TooltipProvider>
      <TableShell>
        {cases.map((caseItem, index) => (
          <CaseRow
            key={caseItem.id}
            caseItem={caseItem}
            index={pageOffset + index + 1}
          />
        ))}
      </TableShell>
    </TooltipProvider>
  );
}
