import { Files } from 'lucide-react';

import { TableCell, TableRow } from '@/components/ui/table';
import type { BatchListItem } from '../schemas/batches-list-schema';
import { formatBatchDate } from '../lib/format-batch-date';
import { ProgramBadge } from './program-badge';
import { StatusBadge } from './status-badge';
import { ExpedientesBreakdown } from './expedientes-breakdown';
import { BatchRowAction } from './batch-row-action';

interface BatchRowProps {
  batch: BatchListItem;
}

/** Una fila de la tabla de lotes. */
export function BatchRow({ batch }: BatchRowProps) {
  const { absolute, relative } = formatBatchDate(batch.created_at);
  const filesCount =
    batch.documents_failed_count + batch.documents_approved_count;
  const pendingReviewCount = batch.triage_summary.verdicts.REQUIRES_TRIAGE ?? 0;

  return (
    <TableRow>
      <TableCell className="px-4 py-3.5 align-middle">
        <div className="font-data text-[12.5px] font-medium text-ink-primary">
          {absolute}
        </div>
        {relative && (
          <div className="mt-0.5 font-data text-[11px] text-ink-muted">
            {relative}
          </div>
        )}
      </TableCell>

      <TableCell className="px-4 py-3.5 align-middle">
        <ProgramBadge name={batch.program_name} />
      </TableCell>

      <TableCell className="max-w-[240px] px-4 py-3.5 align-middle whitespace-normal">
        <div className="font-sans text-sm font-medium text-ink-primary">
          {batch.activity_name ?? 'Actividad sin nombre'}
        </div>
        {batch.description && (
          <div className="mt-0.5 font-data text-[11px] leading-snug text-ink-muted">
            {batch.description}
          </div>
        )}
      </TableCell>

      <TableCell className="px-4 py-3.5 align-middle">
        <span className="inline-flex items-center gap-1.5">
          <Files className="size-3.5 text-ink-muted" />
          <span className="font-data text-sm font-medium text-ink-primary">
            {filesCount}
          </span>
        </span>
      </TableCell>

      <TableCell className="px-4 py-3.5 align-middle">
        <ExpedientesBreakdown
          status={batch.status}
          triageSummary={batch.triage_summary}
        />
      </TableCell>

      <TableCell className="px-4 py-3.5 align-middle">
        <StatusBadge status={batch.status} />
      </TableCell>

      <TableCell className="px-4 py-3.5 text-right align-middle">
        <BatchRowAction
          batchId={batch.id}
          status={batch.status}
          pendingReviewCount={pendingReviewCount}
        />
      </TableCell>
    </TableRow>
  );
}
