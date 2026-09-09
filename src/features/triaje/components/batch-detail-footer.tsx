'use client';

import { toast } from 'sonner';
import { CheckCircle2, Loader2, OctagonAlert, RefreshCw } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { BatchListItem } from '../schemas/batches-list-schema';
import type { BatchDetailSummary } from '../schemas/batch-detail-summary-schema';
import {
  APPROVED_VERDICT_KEYS,
  TRIAGE_VERDICT_LIST,
} from '../lib/triage-verdict-config';
import { useVerifyBatchCompletion, useRetryBatchSync } from '../hooks/use-triaje-queries';

interface BatchDetailFooterProps {
  batchId: string;
  batch?: BatchListItem;
  summary: BatchDetailSummary | undefined;
  isLoading: boolean;
  isError: boolean;
  /** Se invoca tras aprobar el lote con éxito (p. ej. para volver a la bandeja). */
  onApproved?: () => void;
}

/**
 * Footer del detalle: stats por veredicto (fuente = resumen agregado del lote,
 * NO los casos paginados) y el botón principal "Registrar aprobados", que
 * confirma la finalización del lote vía `useVerifyBatchCompletion`.
 * Si el lote está en `SYNC_FAILED`, permite reintentar la sincronización.
 */
export function BatchDetailFooter({
  batchId,
  batch,
  summary,
  isLoading,
  isError,
  onApproved,
}: BatchDetailFooterProps) {
  const verifyCompletion = useVerifyBatchCompletion(batchId);
  const retryBatchSync = useRetryBatchSync(batchId);

  const isSyncing =
    batch?.status === 'SYNCING' ||
    verifyCompletion.isPending ||
    retryBatchSync.isPending;

  const isSyncFailed =
    batch?.status === 'SYNC_FAILED' ||
    verifyCompletion.data?.status === 'SYNC_FAILED' ||
    retryBatchSync.data?.status === 'SYNC_FAILED';

  const syncErrorMessage =
    batch?.failure_reason ||
    (verifyCompletion.data?.status === 'SYNC_FAILED' ? verifyCompletion.data.message : null) ||
    (retryBatchSync.data?.status === 'SYNC_FAILED' ? retryBatchSync.data.message : null);

  const isFinalized = batch?.status === 'FINALIZED';

  const verdicts = summary?.verdicts ?? {};
  const approvedCount = APPROVED_VERDICT_KEYS.reduce(
    (total, key) => total + (verdicts[key] ?? 0),
    0
  );
  const canApprove = approvedCount > 0 && !isSyncing && !isFinalized;

  const handleApprove = () => {
    verifyCompletion.mutate(undefined, {
      onSuccess: (result) => {
        if (result.status === 'SYNC_FAILED') {
          toast.error(result.message || 'Error al sincronizar con el registro de beneficiarios.');
        } else if (result.status === 'COMPLETED') {
          toast.success(result.message || 'Lote registrado y sincronizado correctamente.');
          onApproved?.();
        } else {
          toast.info(result.message);
        }
      },
      onError: (error) => {
        toast.error(error.message || 'No se pudo registrar el lote.');
      },
    });
  };

  const handleRetrySync = () => {
    retryBatchSync.mutate(undefined, {
      onSuccess: (result) => {
        if (result.status === 'COMPLETED') {
          toast.success(result.message || 'Expedientes sincronizados con éxito.');
          onApproved?.();
        } else if (result.status === 'SYNC_FAILED') {
          toast.error(result.message || 'Aún quedan errores al sincronizar.');
        } else {
          toast.info(result.message);
        }
      },
      onError: (error) => {
        toast.error(error.message || 'Fallo al reintentar la sincronización.');
      },
    });
  };

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
          {isSyncFailed ? (
            <Button
              size="lg"
              variant="destructive"
              onClick={handleRetrySync}
              disabled={isSyncing}
              className="bg-error hover:bg-error/90 text-white gap-2"
            >
              {isSyncing ? (
                <Loader2 className="animate-spin size-4" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              {isSyncing ? 'Sincronizando...' : 'Reintentar sincronización'}
            </Button>
          ) : isFinalized ? (
            <Button size="lg" disabled variant="outline" className="bg-success-light text-success-dark border-success/30">
              <CheckCircle2 className="size-4" />
              Lote Finalizado y Cargado
            </Button>
          ) : (
            <Button size="lg" onClick={handleApprove} disabled={!canApprove}>
              {isSyncing ? (
                <Loader2 className="animate-spin size-4" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              {isSyncing ? 'Sincronizando con Beneficiarios...' : `Validar y cargar lote (${approvedCount})`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
