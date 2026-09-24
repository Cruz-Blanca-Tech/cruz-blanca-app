'use client';

import {
  ClipboardList,
  CornerDownRight,
  OctagonAlert,
  TriangleAlert,
  Sparkles,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { FieldStatus } from '../lib/correction-fields';
import type { TriageDiscrepancy } from '../schemas/triage-discrepancy-schema';
import type { CorrectionGroup } from '../lib/correction-form';

export interface EnrichedDiscrepancy extends TriageDiscrepancy {
  fieldId: string | null;
}

export interface SectionIssue {
  text: string;
  group: CorrectionGroup;
  section: string;
}

interface CaseValidationPanelProps {
  isApproved?: boolean;
  statuses: FieldStatus[];
  discrepancies: EnrichedDiscrepancy[];
  sectionIssues: SectionIssue[];
  onJumpField: (fieldId: string) => void;
  onJumpGroup: (group: CorrectionGroup) => void;
}

const SEVERITY_LABEL: Record<string, string> = {
  ERROR: 'Error',
  WARNING: 'Advertencia',
  AI_INSIGHT: 'Sugerencia IA',
};

export function CaseValidationPanel({
  statuses,
  discrepancies,
  sectionIssues,
  onJumpField,
  onJumpGroup,
  isApproved,
}: CaseValidationPanelProps) {
  const total = statuses.length;
  const segments = [
    {
      count: statuses.filter((s) => s === 'ok').length,
      label: 'validados',
      dot: 'bg-success',
      text: 'text-success-dark',
      bar: 'bg-success',
    },
    {
      count: statuses.filter((s) => s === 'warning').length,
      label: 'advertencias',
      dot: 'bg-warning',
      text: 'text-warning-dark',
      bar: 'bg-warning',
    },
    {
      count: statuses.filter((s) => s === 'error').length,
      label: 'errores',
      dot: 'bg-error',
      text: 'text-error-dark',
      bar: 'bg-error',
    },
    {
      count: statuses.filter((s) => s === 'empty').length,
      label: 'por completar',
      dot: 'bg-ink-muted',
      text: 'text-ink-muted',
      bar: 'bg-ink-muted',
    },
  ];
  const observations = discrepancies.length + sectionIssues.length;

  return (
    <div className="rounded-md border border-border bg-white px-3.5 py-2.5">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-3">
        <span className="font-heading text-[12.5px] font-semibold text-ink-primary">
          {total} campos del expediente
        </span>
        <div className="flex flex-wrap gap-3">
          {segments.map((s) => (
            <span
              key={s.label}
              className="inline-flex items-center gap-1.5 font-data text-[11.5px] text-ink-secondary"
            >
              <span className={cn('size-1.5 rounded-full', s.dot)} />
              <strong className={s.text}>{s.count}</strong> {s.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex h-1.5 gap-0.5 overflow-hidden rounded bg-muted">
        {segments.map(
          (s) =>
            s.count > 0 &&
            total > 0 && (
              <div
                key={s.label}
                className={cn('h-full', s.bar)}
                style={{ width: `${(s.count / total) * 100}%` }}
              />
            )
        )}
      </div>

      {isApproved ? (
        <div className="mt-4 border-t border-dashed border-border pt-4 pb-2 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
            <ClipboardList className="size-5 text-success-dark" />
          </div>
          <h4 className="font-heading text-[13px] font-semibold text-ink-primary">Expediente Validado</h4>
          <p className="mt-1 font-data text-[11px] leading-snug text-ink-secondary">
            Cero errores bloqueantes. Se han aceptado las {observations} observaciones restantes.
          </p>
        </div>
      ) : observations > 0 ? (
        <div className="mt-3 border-t border-dashed border-border pt-2.5">
          <div className="mb-2 flex items-center gap-1.5 font-heading text-[11.5px] font-semibold text-ink-primary">
            <ClipboardList className="size-3.5 text-primary" />
            {observations} observaciones de validacion
          </div>
          <div className="flex flex-col gap-1.5">
            {[...discrepancies]
              .sort((a, b) => {
                const prio = { ERROR: 1, WARNING: 2, AI_INSIGHT: 3, INFO: 4 };
                const pA = prio[a.severity as keyof typeof prio] || 99;
                const pB = prio[b.severity as keyof typeof prio] || 99;
                return pA - pB;
              })
              .map((d, i) => {
              const isError = d.severity === 'ERROR';
              const isAi = d.severity === 'AI_INSIGHT';
              const jumpable = Boolean(d.fieldId);
              return (
                <div
                  key={`d-${i}`}
                  onClick={() => d.fieldId && onJumpField(d.fieldId)}
                  className={cn(
                    'flex items-start gap-2 rounded-md border p-2',
                    isError ? 'border-error/20 bg-error-light' : isAi ? 'border-purple-200 bg-purple-50 hover:bg-purple-100' : 'border-warning/20 bg-warning-light',
                    jumpable && 'cursor-pointer'
                  )}
                >
                  {isError ? (<OctagonAlert className="mt-0.5 size-3.5 shrink-0 text-error" />) : isAi ? (<Sparkles className="mt-0.5 size-3.5 shrink-0 text-purple-600" />) : (<TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" />)}
                  <div className="min-w-0 flex-1">
                    <div className="font-data text-[11.5px] leading-snug text-ink-primary">
                      <strong
                        className={isError ? 'text-error-dark' : isAi ? 'text-purple-700' : 'text-warning-dark'}
                      >
                        {SEVERITY_LABEL[d.severity] ?? d.severity}
                      </strong>{' '}
                      - {d.rule_description}
                    </div>
                  </div>
                  {jumpable && (
                    <CornerDownRight
                      className={cn(
                        'mt-0.5 size-3.5 shrink-0',
                        isError ? 'text-error' : isAi ? 'text-purple-600' : 'text-warning'
                      )}
                    />
                  )}
                </div>
              );
            })}
            {sectionIssues.map((s, i) => (
              <div
                key={`s-${i}`}
                onClick={() => onJumpGroup(s.group)}
                className="flex cursor-pointer items-start gap-2 rounded-md border border-warning/20 bg-warning-light p-2"
              >
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" />
                <div className="min-w-0 flex-1">
                  <div className="font-data text-[11.5px] leading-snug text-ink-primary">
                    <strong className="text-warning-dark">Observacion</strong> -{' '}
                    {s.text}
                  </div>
                  <div className="mt-0.5 font-data text-[10.5px] text-ink-muted">
                    Seccion:{' '}
                    <strong className="text-ink-secondary">{s.section}</strong>
                  </div>
                </div>
                <CornerDownRight className="mt-0.5 size-3.5 shrink-0 text-warning" />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
