'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  useBatch,
  useBatchCases,
  useBatchDetailSummary,
} from '../hooks/use-triaje-queries';
import { BatchDetailHeader } from './batch-detail-header';
import { CasesTable } from './cases-table';
import { BatchDetailFooter } from './batch-detail-footer';
import { RejectBatchDialog } from './reject-batch-dialog';

interface BatchDetailScreenProps {
  batchId: string;
}

const PAGE_SIZE = 25;

/** Orquestador del detalle de un lote (ruta /triaje/[batchId]). */
export function BatchDetailScreen({ batchId }: BatchDetailScreenProps) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [rejectOpen, setRejectOpen] = useState(false);

  const batchQuery = useBatch(batchId);
  const batch = batchQuery.data;

  const casesQuery = useBatchCases(batchId, {
    skip: page * PAGE_SIZE,
    limit: PAGE_SIZE,
  });
  const summaryQuery = useBatchDetailSummary(batchId);

  const cases = casesQuery.data?.items ?? [];
  const total = casesQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Tras aprobar o rechazar, el lote deja la cola "por revisar": vuelve a la
  // bandeja (las mutaciones ya invalidaron el listado y el resumen).
  const goBackToInbox = () => router.push('/triaje');

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <BatchDetailHeader
        batch={batch}
        isLoading={batchQuery.isLoading}
        isError={batchQuery.isError}
        onOpenReject={() => setRejectOpen(true)}
      />

      <CasesTable
        cases={cases}
        isLoading={casesQuery.isLoading}
        isError={casesQuery.isError}
        pageOffset={page * PAGE_SIZE}
      />

      {/* Paginación */}
      <div className="flex flex-wrap items-center justify-between gap-3 font-data text-[11.5px] text-ink-muted">
        <span>
          Mostrando {cases.length} de {total} expedientes
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
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
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Siguiente
              <ChevronRight />
            </Button>
          </div>
        )}
      </div>

      <BatchDetailFooter
        batch={batch}
        summary={summaryQuery.data}
        isLoading={summaryQuery.isLoading}
        isError={summaryQuery.isError}
      />

      <RejectBatchDialog
        batchId={batchId}
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onRejected={goBackToInbox}
      />
    </div>
  );
}