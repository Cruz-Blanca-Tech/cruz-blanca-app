import { Files, User } from 'lucide-react';

import type { BatchListItem } from '../schemas/batches-list-schema';
import { formatBatchDate } from '../lib/format-batch-date';
import { ProgramBadge } from './program-badge';
import { StatusBadge } from './status-badge';
import { ExpedientesBreakdown } from './expedientes-breakdown';
import { BatchRowAction } from './batch-row-action';

interface BatchRowProps {
  batch: BatchListItem;
}

/** Una fila (tarjeta) de la lista de lotes. */
export function BatchRow({ batch }: BatchRowProps) {
  const { absolute, relative } = formatBatchDate(batch.created_at);
  const filesCount =
    batch.documents_total_count ??
    batch.total_documents_count ??
    (batch.documents_failed_count + batch.documents_approved_count);
  const pendingReviewCount = batch.triage_summary.verdicts.REQUIRES_TRIAGE ?? 0;

  return (
    <li className="group flex flex-col sm:flex-row gap-5 p-5 rounded-xl bg-card border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-blue-500/30 relative">
      
      {/* Contenido principal (Izquierda) */}
      <div className="flex-1 min-w-0 flex flex-col gap-2.5">
        
        {/* Fila de metadatos: Programa, Usuario y Fecha */}
        <div className="flex items-center gap-2 font-data text-[11.5px] font-medium text-ink-muted flex-wrap">
          <ProgramBadge name={batch.program_name} />
          
          {batch.created_by_name && (
            <>
              <span className="text-slate-300">&bull;</span>
              <span className="flex items-center gap-1 text-slate-500">
                <User className="size-3" />
                {batch.created_by_name}
              </span>
            </>
          )}

          <span className="text-slate-300">&bull;</span>
          <span title={absolute}>{relative || absolute}</span>
        </div>

        {/* Título y Descripción */}
        <div className="min-w-0">
          <h3 className="font-sans text-[14.5px] font-bold text-ink-primary group-hover:text-blue-600 transition-colors truncate">
            {batch.activity_name ?? 'Actividad sin nombre'}
          </h3>
          {batch.description ? (
            <p className="mt-1 font-sans text-xs leading-relaxed text-ink-muted line-clamp-2">
              {batch.description}
            </p>
          ) : (
            <p className="mt-1 font-sans text-xs italic text-slate-400">
              Sin descripción detallada
            </p>
          )}
        </div>

        {/* Estadísticas: Archivos y Desglose */}
        <div className="flex flex-wrap items-center gap-3 mt-1">
          <span className="inline-flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200/60">
            <Files className="size-3.5 text-slate-500" />
            <span className="font-data text-xs font-semibold text-slate-600">
              {filesCount} archivos subidos
            </span>
          </span>
          <ExpedientesBreakdown
            status={batch.status}
            triageSummary={batch.triage_summary}
            failureReason={batch.failure_reason}
          />
        </div>
      </div>

      {/* Acciones y Estado (Derecha) */}
      <div className="flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-3 shrink-0 sm:pl-5 sm:border-l sm:border-slate-100">
        <StatusBadge status={batch.status} failureReason={batch.failure_reason} />
        
        <BatchRowAction
          batchId={batch.id}
          status={batch.status}
          pendingReviewCount={pendingReviewCount}
        />
      </div>

    </li>
  );
}
