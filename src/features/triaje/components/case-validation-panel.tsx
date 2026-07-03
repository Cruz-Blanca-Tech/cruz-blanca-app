'use client';

import {
  ClipboardList,
  CornerDownRight,
  OctagonAlert,
  TriangleAlert,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { FieldStatus } from '../lib/correction-fields';
import type { TriageDiscrepancy } from '../schemas/triage-discrepancy-schema';
import type { CorrectionGroup } from '../lib/correction-form';

/** Discrepancia enriquecida con el id del campo al que salta (si se mapeó). */
export interface EnrichedDiscrepancy extends TriageDiscrepancy {
  fieldId: string | null;
}

/** Observación a nivel de sección (de `validation_issues`). */
export interface SectionIssue {
  text: string;
  group: CorrectionGroup;
  section: string;
}

interface CaseValidationPanelProps {
  statuses: FieldStatus[];
  discrepancies: EnrichedDiscrepancy[];
  sectionIssues: SectionIssue[];
  onJumpField: (fieldId: string) => void;
  onJumpGroup: (group: CorrectionGroup) => void;
}

const SEVERITY_LABEL: Record<string, string> = {
  ERROR: 'Error',
  WARNING: 'Advertencia',
};

/** Panel de validación: conteos por estado + lista de observaciones con salto. */
export function CaseValidationPanel({
  statuses,
  discrepancies,
  sectionIssues,
  onJumpField,
  onJumpGroup,
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

      {observations > 0 && (
        <div className="mt-3 border-t border-dashed border-border pt-2.5">
          <div className="mb-2 flex items-center gap-1.5 font-heading text-[11.5px] font-semibold text-ink-primary">
            <ClipboardList className="size-3.5 text-primary" />
            {observations} observaciones de validación
          </div>
          <div className="flex flex-col gap-1.5">
            {discrepancies.map((d, i) => {
              const isError = d.severity === 'ERROR';
              const jumpable = Boolean(d.fieldId);
              return (
                <div
                  key={`d-${i}`}
                  onClick={() => d.fieldId && onJumpField(d.fieldId)}
                  className={cn(
                    'flex items-start gap-2 rounded-md border p-2',
                    isError
                      ? 'border-error/20 bg-error-light'
                      : 'border-warning/20 bg-warning-light',
                    jumpable && 'cursor-pointer'
                  )}
                >
                  {isError ? (
                    <OctagonAlert className="mt-0.5 size-3.5 shrink-0 text-error" />
                  ) : (
                    <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-data text-[11.5px] leading-snug text-ink-primary">
                      <strong
                        className={isError ? 'text-error-dark' : 'text-warning-dark'}
                      >
                        {SEVERITY_LABEL[d.severity] ?? d.severity}
                      </strong>{' '}
                      · {d.rule_description}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-2.5 font-data text-[10.5px] text-ink-muted">
                      <span>
                        Campo:{' '}
                        <strong className="text-ink-secondary">
                          {d.field_name}
                        </strong>
                      </span>
                      {d.expected_pattern && (
                        <span>Esperado: {d.expected_pattern}</span>
                      )}
                      {d.actual_value && <span>Leído: {d.actual_value}</span>}
                      {d.document_code && (
                        <span className="opacity-70">[{d.document_code}]</span>
                      )}
                    </div>
                  </div>
                  {jumpable && (
                    <CornerDownRight
                      className={cn(
                        'mt-0.5 size-3.5 shrink-0',
                        isError ? 'text-error' : 'text-warning'
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
                    <strong className="text-warning-dark">Observación</strong> ·{' '}
                    {s.text}
                  </div>
                  <div className="mt-0.5 font-data text-[10.5px] text-ink-muted">
                    Sección:{' '}
                    <strong className="text-ink-secondary">{s.section}</strong>
                  </div>
                </div>
                <CornerDownRight className="mt-0.5 size-3.5 shrink-0 text-warning" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
