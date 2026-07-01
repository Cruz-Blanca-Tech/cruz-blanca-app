'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { Check, Clock, Loader2, PencilLine, RefreshCw, XCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import type { BatchStatus } from '../schemas/batch-status-schema';

interface BatchRowActionProps {
  /** Id del lote, para navegar a su detalle (/triaje/[batchId]). */
  batchId: string;
  status: BatchStatus;
  /** Expedientes que requieren triaje (REQUIRES_TRIAGE), para el contador del botón. */
  pendingReviewCount: number;
}

// TODO: el endpoint de reintento de OCR aún no existe. Reemplazar por la mutación
// correspondiente cuando esté disponible.
function notifyRetryComingSoon() {
  toast.info('El reintento de procesamiento estará disponible próximamente.');
}

/** Acción de la fila según el estado del lote (réplica visual del mockup). */
export function BatchRowAction({
  batchId,
  status,
  pendingReviewCount,
}: BatchRowActionProps) {
  switch (status) {
    case 'COMPLETED':
      return (
        <Link
          href={`/triaje/${batchId}`}
          className={cn(buttonVariants({ size: 'sm' }))}
        >
          <PencilLine />
          Revisar
          {pendingReviewCount > 0 && (
            <span className="rounded-full bg-primary-foreground/20 px-1.5 font-data text-[11px] font-semibold">
              {pendingReviewCount}
            </span>
          )}
        </Link>
      );

    case 'FINALIZED':
      return (
        <Link
          href={`/triaje/${batchId}`}
          className={cn(
            buttonVariants({ size: 'sm' }),
            'bg-success-light text-success-dark hover:bg-success-light/80'
          )}
        >
          <Check />
          Revisado
        </Link>
      );

    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-error-light px-3.5 py-1.5 font-sans text-sm font-medium text-error-dark">
          <XCircle className="size-3.5" />
          Rechazado
        </span>
      );

    case 'FAILED':
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={notifyRetryComingSoon}
          className="border-fault/40 bg-fault-light text-fault-dark hover:bg-fault-light/70"
        >
          <RefreshCw />
          Reintentar
        </Button>
      );

    case 'PROCESSING':
      return (
        <Button size="sm" variant="ghost" disabled className="bg-muted text-ink-muted">
          <Loader2 className="animate-spin" />
          Procesando…
        </Button>
      );

    case 'PENDING':
    default:
      return (
        <Button
          size="sm"
          variant="ghost"
          disabled
          className={cn('bg-muted text-ink-muted')}
        >
          <Clock />
          En cola
        </Button>
      );
  }
}
