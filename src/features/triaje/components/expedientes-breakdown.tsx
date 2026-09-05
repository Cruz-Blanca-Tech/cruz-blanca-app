import { Clock, Loader2, XCircle, OctagonAlert } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { BatchStatus } from '../schemas/batch-status-schema';
import type { BatchTriageSummary } from '../schemas/batches-list-schema';
import { TRIAGE_VERDICT_LIST } from '../lib/triage-verdict-config';

interface ExpChipProps {
  count: number;
  label: string;
  icon: typeof Clock;
  className: string;
}

function ExpChip({ count, label, icon: Icon, className }: ExpChipProps) {
  return (
    <span
      title={label}
      className={cn(
        'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5',
        className
      )}
    >
      <Icon className="size-3" />
      <span className="font-data text-xs font-bold">{count}</span>
    </span>
  );
}

interface StatusTextProps {
  icon: typeof Clock;
  text: string;
  className: string;
  spin?: boolean;
}

function StatusText({ icon: Icon, text, className, spin }: StatusTextProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-data text-[11.5px] italic',
        className
      )}
    >
      <Icon className={cn('size-3', spin && 'animate-spin')} />
      {text}
    </span>
  );
}

interface ExpedientesBreakdownProps {
  status: BatchStatus;
  triageSummary: BatchTriageSummary;
  failureReason?: string | null;
}

/**
 * Desglose de expedientes de un lote. Para COMPLETED/FINALIZED muestra los chips
 * de veredictos (leídos de `triage_summary.verdicts`); para el resto muestra el
 * texto de estado correspondiente del mockup.
 *
 * Recorre solo los veredictos conocidos y trata las claves ausentes como 0, así
 * que un `verdicts: {}` (fallback del backend) renderiza todos los chips en 0
 * sin romper.
 */
export function ExpedientesBreakdown({
  status,
  triageSummary,
  failureReason,
}: ExpedientesBreakdownProps) {
  if (status === 'PENDING') {
    return (
      <StatusText
        icon={Clock}
        text="En cola de procesamiento"
        className="text-ink-muted"
      />
    );
  }
  if (status === 'PROCESSING') {
    return (
      <StatusText
        icon={Loader2}
        text="La IA está leyendo los PDFs…"
        className="text-warning-dark"
        spin
      />
    );
  }
  if (status === 'REJECTED') {
    return (
      <StatusText
        icon={XCircle}
        text="Lote descartado"
        className="text-error-dark"
      />
    );
  }
  if (status === 'FAILED') {
    const errorNode = (
      <span
        title={failureReason ?? undefined}
        className={cn(
          'inline-flex items-center gap-1.5 font-data text-[11.5px] italic text-fault-dark',
          failureReason && 'cursor-help underline decoration-dotted underline-offset-4 hover:opacity-90'
        )}
      >
        <OctagonAlert className="size-3 shrink-0" />
        Ocurrió un error en el procesamiento
      </span>
    );

    if (!failureReason) {
      return errorNode;
    }

    return (
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex cursor-help" />}>
          {errorNode}
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs px-3 py-2 text-left bg-slate-900 text-white border border-slate-700 shadow-lg"
        >
          <div className="flex items-start gap-2">
            <OctagonAlert className="size-3.5 shrink-0 text-red-400 mt-0.5" />
            <div className="space-y-0.5 min-w-0">
              <p className="font-semibold text-xs text-red-300">
                Detalle del fallo
              </p>
              <p className="text-[11px] leading-snug text-slate-200 break-words font-sans">
                {failureReason}
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // COMPLETED / FINALIZED → chips de veredictos.
  return (
    <div className="flex flex-wrap gap-1">
      {TRIAGE_VERDICT_LIST.map((verdict) => (
        <ExpChip
          key={verdict.key}
          count={triageSummary.verdicts[verdict.key] ?? 0}
          label={verdict.label}
          icon={verdict.icon}
          className={verdict.chipClassName}
        />
      ))}
    </div>
  );
}
