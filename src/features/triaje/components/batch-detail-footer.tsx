'use client';

import { CheckCircle2, OctagonAlert } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { BatchListItem } from '../schemas/batches-list-schema';
import type { BatchDetailSummary } from '../schemas/batch-detail-summary-schema';
import { TRIAGE_VERDICT_LIST } from '../lib/triage-verdict-config';

interface BatchDetailFooterProps {
  batch?: BatchListItem;
  summary: BatchDetailSummary | undefined;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Footer del detalle: stats por veredicto (fuente = resumen agregado del lote,
 * NO los casos paginados) y el estado de cierre.
 *
 * No hay botón de cierre. El lote se cierra solo cuando todos sus expedientes
 * están rechazados y/o cargados en MDM, así que acá solo se informa cómo va: si
 * quedó algún expediente sin cargar, se dice cuál y desde dónde se reintenta.
 */
export function BatchDetailFooter({
  batch,
  summary,
  isLoading,
  isError,
}: BatchDetailFooterProps) {
  const isSyncFailed = batch?.status === 'SYNC_FAILED';
  const syncErrorMessage = batch?.failure_reason;
  const isFinalized = batch?.status === 'FINALIZED';

  const verdicts = summary?.verdicts ?? {};

  return (
    <div className="flex flex-col gap-3">
      {isSyncFailed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-error/30 bg-error-light/50 px-4 py-3 text-error-dark">
          <div className="flex items-center gap-2">
            <OctagonAlert className="size-4 shrink-0 text-error" />
            <div className="text-xs">
              <span className="font-semibold">Error de sincronización con Beneficiarios: </span>
              <span>{syncErrorMessage || 'Uno o más expedientes no pudieron guardarse en el registro central.'}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-slate-50 px-4 py-3">
        {isError ? (
          <span className="inline-flex items-center gap-1.5 font-data text-xs text-error-dark">
            <OctagonAlert className="size-3.5" />
            No se pudo cargar el resumen del lote.
          </span>
        ) : isLoading ? (
          <div className="flex items-center gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-24" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            {TRIAGE_VERDICT_LIST.filter(
              (verdict) => (verdicts[verdict.key] ?? 0) > 0
            ).map((verdict) => {
              const Icon = verdict.icon;
              return (
                <span
                  key={verdict.key}
                  className="inline-flex items-center gap-1.5 font-data text-[12.5px]"
                >
                  <Icon className={cn('size-3.5', verdict.legendIconClassName)} />
                  <strong className={verdict.legendIconClassName}>
                    {verdicts[verdict.key]}
                  </strong>
                  <span className="text-ink-muted">
                    {verdict.label.toLowerCase()}
                  </span>
                </span>
              );
            })}
            {summary && (
              <span className="font-data text-[12.5px] text-ink-muted">
                · {summary.total_cases} en total
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {isFinalized ? (
            <span className="inline-flex items-center gap-1.5 font-data text-[12.5px] text-success-dark">
              <CheckCircle2 className="size-3.5" />
              Lote cerrado: todos sus expedientes están cargados o rechazados.
            </span>
          ) : isSyncFailed ? (
            <span className="font-data text-[12.5px] text-ink-muted">
              Corregí el expediente que falló y reintentá la carga desde su ficha.
            </span>
          ) : (
            <span className="font-data text-[12.5px] text-ink-muted">
              Cada expediente se carga al registro de beneficiarios al validarlo. El
              lote se cierra solo cuando todos estén cargados o rechazados.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
