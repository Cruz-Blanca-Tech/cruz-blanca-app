'use client';

import { toast } from 'sonner';
import { CheckCircle2, Loader2, OctagonAlert } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { BatchDetailSummary } from '../schemas/batch-detail-summary-schema';
import {
  APPROVED_VERDICT_KEYS,
  TRIAGE_VERDICT_LIST,
} from '../lib/triage-verdict-config';
import { useVerifyBatchCompletion } from '../hooks/use-triaje-queries';

interface BatchDetailFooterProps {
  batchId: string;
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
 */
export function BatchDetailFooter({
  batchId,
  summary,
  isLoading,
  isError,
  onApproved,
}: BatchDetailFooterProps) {
  const verifyCompletion = useVerifyBatchCompletion(batchId);

  const verdicts = summary?.verdicts ?? {};
  const approvedCount = APPROVED_VERDICT_KEYS.reduce(
    (total, key) => total + (verdicts[key] ?? 0),
    0
  );
  const canApprove = approvedCount > 0 && !verifyCompletion.isPending;

  const handleApprove = () => {
    verifyCompletion.mutate(undefined, {
      onSuccess: (result) => {
        toast.success(result.message || 'Lote registrado correctamente.');
        onApproved?.();
      },
      onError: (error) => {
        toast.error(error.message || 'No se pudo registrar el lote.');
      },
    });
  };

  return (
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

      <Button size="lg" onClick={handleApprove} disabled={!canApprove}>
        {verifyCompletion.isPending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <CheckCircle2 />
        )}
        Registrar aprobados ({approvedCount})
      </Button>
    </div>
  );
}
