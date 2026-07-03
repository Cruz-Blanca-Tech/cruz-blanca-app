'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Ban, ChevronRight, Inbox, OctagonAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { BatchListItem } from '../schemas/batches-list-schema';
import { formatBatchDate } from '../lib/format-batch-date';
import { ProgramBadge } from './program-badge';
import { StatusBadge } from './status-badge';

interface BatchDetailHeaderProps {
  /** Metadata del lote (GET /batches/{id}); `undefined` mientras carga o si falla. */
  batch: BatchListItem | undefined;
  isLoading: boolean;
  /** Error al cargar la metadata (incluye 404 / lote no encontrado). */
  isError: boolean;
  onOpenReject: () => void;
  /** Deshabilita "Cancelar lote" (p. ej. lote ya finalizado/rechazado). */
  canReject: boolean;
}

/**
 * Encabezado del detalle del lote: breadcrumb, título con badges de
 * programa/actividad/estado y acciones. La metadata sale de `useBatch(batchId)`,
 * así que funciona igual navegando desde la bandeja o entrando directo por URL.
 * Muestra skeleton mientras carga y un aviso si la metadata falla, sin romper la
 * pantalla (las acciones siguen disponibles).
 */
export function BatchDetailHeader({
  batch,
  isLoading,
  isError,
  onOpenReject,
  canReject,
}: BatchDetailHeaderProps) {
  const router = useRouter();
  const date = batch ? formatBatchDate(batch.created_at) : null;

  return (
    <header className="flex flex-col gap-3.5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 font-data text-xs text-ink-muted">
        <Link
          href="/triaje"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          <Inbox className="size-3" />
          Triaje
        </Link>
        {batch?.program_name && (
          <>
            <ChevronRight className="size-3 text-ink-disabled" />
            <span>{batch.program_name}</span>
          </>
        )}
        <ChevronRight className="size-3 text-ink-disabled" />
        <span className="font-medium text-ink-primary">
          {date?.absolute ?? 'Lote'}
        </span>
      </nav>

      {/* Título + acciones */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-7 w-72" />
              <Skeleton className="h-5 w-96" />
            </div>
          ) : isError || !batch ? (
            <>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-ink-primary">
                Lote no encontrado
              </h1>
              <p className="mt-1.5 inline-flex items-center gap-1.5 font-data text-xs text-error-dark">
                <OctagonAlert className="size-3.5" />
                No se pudo cargar la información del lote.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-ink-primary">
                Lote del {date?.absolute}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <ProgramBadge name={batch.program_name} />
                <StatusBadge status={batch.status} />
                <span className="font-data text-xs text-ink-muted">
                  {batch.activity_name ?? 'Actividad sin nombre'}
                  {` · ${batch.triage_summary.total_cases} expediente(s)`}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <Button
            variant="destructive"
            onClick={onOpenReject}
            disabled={!canReject}
          >
            <Ban />
            Cancelar lote
          </Button>
          <Button variant="outline" onClick={() => router.push('/triaje')}>
            <ArrowLeft />
            Volver al triaje
          </Button>
        </div>
      </div>
    </header>
  );
}
