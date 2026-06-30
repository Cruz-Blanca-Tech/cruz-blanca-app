'use client';

import Link from 'next/link';
import { useShallow } from 'zustand/react/shallow';
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';

import { useBatches } from '../hooks/use-triaje-queries';
import { useTriajeFiltersStore } from '../stores/triaje-filters-store';
import { SummaryCards } from './summary-cards';
import { TriajeFilters } from './triaje-filters';
import { BreakdownLegend } from './breakdown-legend';
import { BatchesTable } from './batches-table';

/** Lotes por página (el listado del backend pagina con `skip`/`limit`). */
const PAGE_SIZE = 25;

/** Orquestador de la bandeja de triaje (ruta /triaje). */
export function TriajeLotesScreen() {
  const { programId, activityId, status, page, setPage } = useTriajeFiltersStore(
    useShallow((s) => ({
      programId: s.programId,
      activityId: s.activityId,
      status: s.status,
      page: s.page,
      setPage: s.setPage,
    }))
  );

  const { data, isLoading, isError } = useBatches({
    programId,
    activityId,
    status,
    skip: page * PAGE_SIZE,
    limit: PAGE_SIZE,
  });

  const batches = data?.batches ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = programId !== null || activityId !== null || status !== null;

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      {/* Encabezado */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-ink-primary">
            Bandeja de triaje
          </h1>
          <p className="mt-0.5 font-sans text-sm text-ink-muted">
            Lotes de documentos enviados al motor de OCR. Revisa los que estén
            pendientes de revisión.
          </p>
        </div>
        <Link
          href="/carga-datos"
          className={cn(buttonVariants({ size: 'lg' }), 'shrink-0')}
        >
          <Plus />
          Cargar nuevo lote
        </Link>
      </header>

      {/* KPIs */}
      <SummaryCards />

      {/* Filtros */}
      <TriajeFilters />

      {/* Leyenda + tabla */}
      <div>
        <BreakdownLegend />
        <BatchesTable
          batches={batches}
          isLoading={isLoading}
          isError={isError}
          hasFilters={hasFilters}
        />
      </div>

      {/* Footer: conteo, paginación y aviso de auto-refresh */}
      <footer className="flex flex-wrap items-center justify-between gap-3 font-data text-[11.5px] text-ink-muted">
        <span>
          Mostrando {batches.length} de {total} lotes
        </span>

        <div className="flex items-center gap-3">
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                <ChevronLeft />
                Anterior
              </Button>
              <span>
                Página {page + 1} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
              >
                Siguiente
                <ChevronRight />
              </Button>
            </div>
          )}
          <span className="inline-flex items-center gap-1.5">
            <RefreshCw className="size-3" />
            Actualización automática cada 30 s
          </span>
        </div>
      </footer>
    </div>
  );
}
