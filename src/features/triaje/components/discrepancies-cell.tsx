import { ListChecks, XCircle, TriangleAlert } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { TriageDiscrepancy } from '../schemas/triage-cases-schema';

interface DiscrepanciesCellProps {
  discrepancies: TriageDiscrepancy[];
}

/** Una discrepancia con severidad de error (lo demás se trata como observación). */
function isError(discrepancy: TriageDiscrepancy): boolean {
  return discrepancy.severity.toUpperCase() === 'ERROR';
}

/** Línea de una discrepancia dentro del tooltip de detalle. */
function DiscrepancyItem({ discrepancy }: { discrepancy: TriageDiscrepancy }) {
  const error = isError(discrepancy);
  const Icon = error ? XCircle : TriangleAlert;
  return (
    <li className="flex gap-1.5">
      <Icon
        className={cn(
          'mt-0.5 size-3 shrink-0',
          error ? 'text-error-soft' : 'text-warning-accent'
        )}
      />
      <div className="min-w-0">
        <p
          className={cn(
            'font-data text-[11px] font-semibold',
            error ? 'text-error-soft' : 'text-warning-accent'
          )}
        >
          {discrepancy.field_name}
        </p>
        <p className="font-data text-[11px] leading-snug opacity-85">
          {discrepancy.rule_description}
        </p>
        {discrepancy.actual_value && (
          <p className="mt-0.5 font-data text-[10.5px] opacity-70">
            Valor: <span className="font-medium">{discrepancy.actual_value}</span>
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * Celda compacta de discrepancias: un chip con el conteo total y, al pasar el
 * cursor, un tooltip que lista cada discrepancia (campo, regla y valor) agrupada
 * por severidad. Replica el patrón de tooltips del mockup con shadcn/Base UI.
 */
export function DiscrepanciesCell({ discrepancies }: DiscrepanciesCellProps) {
  if (discrepancies.length === 0) {
    return <span className="font-data text-xs text-ink-muted">—</span>;
  }

  const errors = discrepancies.filter(isError);
  const warnings = discrepancies.filter((d) => !isError(d));

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-sm bg-slate-100 px-2 py-0.5 font-data text-xs font-semibold text-ink-secondary transition-colors hover:bg-slate-200 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          />
        }
      >
        <ListChecks className="size-3" />
        {discrepancies.length}
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-72 px-3 py-2.5">
        <div className="flex flex-col gap-2 text-left">
          <span className="font-data text-[10.5px] font-semibold tracking-wide uppercase opacity-80">
            Campos afectados
          </span>
          <ul className="flex flex-col gap-2">
            {errors.map((discrepancy, index) => (
              <DiscrepancyItem key={`e-${index}`} discrepancy={discrepancy} />
            ))}
            {warnings.map((discrepancy, index) => (
              <DiscrepancyItem key={`w-${index}`} discrepancy={discrepancy} />
            ))}
          </ul>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
