import { cn } from '@/lib/utils';
import { TRIAGE_VERDICT_LIST } from '../lib/triage-verdict-config';

/** Leyenda que explica los iconos del desglose de expedientes de la tabla. */
export function BreakdownLegend() {
  return (
    <div className="mb-2.5 flex flex-wrap items-center gap-4 rounded-md border border-border bg-slate-50 px-3 py-2 font-data text-[11.5px] text-ink-secondary">
      <span className="text-[10.5px] font-semibold tracking-wide text-ink-muted uppercase">
        Desglose de expedientes
      </span>
      {TRIAGE_VERDICT_LIST.map((verdict) => {
        const Icon = verdict.icon;
        return (
          <span key={verdict.key} className="inline-flex items-center gap-1.5">
            <Icon className={cn('size-3', verdict.legendIconClassName)} />
            {verdict.label}
          </span>
        );
      })}
    </div>
  );
}
