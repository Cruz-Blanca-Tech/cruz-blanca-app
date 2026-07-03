'use client';

import Link from 'next/link';
import { XCircle, TriangleAlert, PencilLine } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import type { TriageCaseListItem } from '../schemas/triage-cases-schema';
import { CaseVerdictBadge } from './case-verdict-badge';
import { DiscrepanciesCell } from './discrepancies-cell';

interface CaseRowProps {
  caseItem: TriageCaseListItem;
  /** Número de fila (1-based) considerando la página actual. */
  index: number;
}

interface CountCellProps {
  count: number;
  icon: typeof XCircle;
  /** Clases del chip cuando hay incidencias (> 0). */
  activeClassName: string;
}

/** Chip numérico de errores/observaciones; neutro cuando es 0. */
function CountCell({ count, icon: Icon, activeClassName }: CountCellProps) {
  const active = count > 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-data text-xs font-bold',
        active ? activeClassName : 'text-ink-disabled'
      )}
    >
      <Icon className="size-3" />
      {count}
    </span>
  );
}

/** Fila de un expediente del lote. Se tiñe el fondo según la severidad máxima. */
export function CaseRow({ caseItem, index }: CaseRowProps) {
  const hasErrors = caseItem.error_count > 0;
  const hasWarnings = caseItem.warning_count > 0;

  return (
    <TableRow
      className={cn(
        hasErrors
          ? 'bg-error-light/40 hover:bg-error-light/60'
          : hasWarnings
            ? 'bg-warning-light/40 hover:bg-warning-light/60'
            : undefined
      )}
    >
      <TableCell className="px-4 py-3 text-right align-middle font-data text-[11px] text-ink-muted">
        {index}
      </TableCell>

      <TableCell className="px-4 py-3 align-middle font-data text-[12.5px] font-medium text-ink-primary">
        {caseItem.dni_reference}
      </TableCell>

      <TableCell className="px-4 py-3 align-middle">
        <CountCell
          count={caseItem.error_count}
          icon={XCircle}
          activeClassName="bg-error-light text-error-dark"
        />
      </TableCell>

      <TableCell className="px-4 py-3 align-middle">
        <CountCell
          count={caseItem.warning_count}
          icon={TriangleAlert}
          activeClassName="bg-warning-light text-warning-dark"
        />
      </TableCell>

      <TableCell className="px-4 py-3 align-middle">
        <DiscrepanciesCell discrepancies={caseItem.discrepancies} />
      </TableCell>

      <TableCell className="px-4 py-3 align-middle">
        <CaseVerdictBadge verdict={caseItem.verdict} />
      </TableCell>

      <TableCell className="px-4 py-3 text-right align-middle">
        {/* El `dni_reference` estable (no `beneficiary.dni`, que se corrige) viaja
            en la URL para alimentar el visor de documentos tras un F5. */}
        <Button
          size="sm"
          variant="outline"
          nativeButton={false}
          render={
            <Link
              href={`/triaje/${caseItem.batch_id}/${caseItem.id}?dni=${encodeURIComponent(caseItem.dni_reference)}`}
            />
          }
        >
          <PencilLine />
          Corregir
        </Button>
      </TableCell>
    </TableRow>
  );
}
