import Link from 'next/link';
import { XCircle, TriangleAlert, PencilLine, Eye } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { TriageCaseListItem } from '../schemas/triage-cases-schema';
import { isCaseFinalized } from '../lib/case-actions';
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
  const isSyncFailed = caseItem.sync_status === 'FAILED';
  // Un expediente ya resuelto se sigue pudiendo abrir (consultar el detalle es
  // legítimo), pero se anuncia como lectura: sus campos no admiten corrección.
  const isFinalized = isCaseFinalized(caseItem.status);

  return (
    <li
      className={cn(
        'grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-3 sm:p-4 rounded-xl border shadow-sm transition-all hover:shadow-md relative',
        isSyncFailed
          ? 'bg-error-light/50 hover:bg-error-light/70 border-l-4 border-l-error border-y-error/30 border-r-error/30'
          : hasErrors
            ? 'bg-error-light/20 hover:bg-error-light/40 border-error/20'
            : hasWarnings
              ? 'bg-warning-light/20 hover:bg-warning-light/40 border-warning/30'
              : 'bg-card hover:border-blue-500/30'
      )}
    >
      {/* 1. Índice y DNI (3/12) */}
      <div className="sm:col-span-3 flex items-center gap-3 min-w-0">
        <span className="w-7 text-right font-data text-xs text-slate-400 select-none">
          {index}
        </span>
        <span className="font-data text-[14.5px] font-bold text-ink-primary truncate">
          {caseItem.dni_reference}
        </span>
      </div>

      {/* 2. Veredicto y Estado de Sincronización (3/12) */}
      <div className="sm:col-span-3 flex flex-col items-start gap-1.5 min-w-0">
        <CaseVerdictBadge verdict={caseItem.verdict} />
        {isSyncFailed && (
          <span
            title={caseItem.sync_error || 'Error al sincronizar con Beneficiarios'}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold bg-error-light text-error-dark border border-error/30 cursor-help"
          >
            <TriangleAlert className="size-3 text-error" />
            Error de sincronización
          </span>
        )}
      </div>

      {/* 3. Incidencias Detectadas (4/12) */}
      <div className="sm:col-span-4 flex flex-wrap items-center gap-2 min-w-0">
        {hasErrors || hasWarnings || caseItem.discrepancies.length > 0 ? (
          <>
            {hasErrors && (
              <CountCell
                count={caseItem.error_count}
                icon={XCircle}
                activeClassName="bg-error-light text-error-dark border border-error/20"
              />
            )}
            {hasWarnings && (
              <CountCell
                count={caseItem.warning_count}
                icon={TriangleAlert}
                activeClassName="bg-warning-light text-warning-dark border border-warning/30"
              />
            )}
            <DiscrepanciesCell discrepancies={caseItem.discrepancies} />
          </>
        ) : (
          <span className="font-data text-xs italic text-slate-400">Sin incidencias</span>
        )}
      </div>

      {/* 4. Acciones (2/12) */}
      <div className="sm:col-span-2 flex justify-start sm:justify-end min-w-0">
        <Button
          size="sm"
          variant={isSyncFailed ? 'outline' : isFinalized ? 'ghost' : 'outline'}
          className={cn(
            'w-full sm:w-auto transition-colors',
            isSyncFailed
              ? 'border-error/40 bg-error-light text-error-dark hover:bg-error-light/80 hover:text-error-dark'
              : !isFinalized && 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
          )}
          nativeButton={false}
          render={
            <Link
              href={`/triaje/${caseItem.batch_id}/${caseItem.id}?dni=${encodeURIComponent(caseItem.dni_reference)}`}
            />
          }
        >
          {isSyncFailed ? <TriangleAlert className="size-4" /> : isFinalized ? <Eye className="size-4" /> : <PencilLine className="size-4" />}
          {isSyncFailed ? 'Ver error' : isFinalized ? 'Ver' : 'Corregir'}
        </Button>
      </div>
    </li>
  );
}
