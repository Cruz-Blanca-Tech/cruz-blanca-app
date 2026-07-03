'use client';

import { ListChecks } from 'lucide-react';

import { cn } from '@/lib/utils';
import type {
  CorrectionFieldDescriptor,
  FieldValidation,
} from '../lib/correction-fields';
import { CORRECTION_GROUPS, type CorrectionGroup } from '../lib/correction-form';
import { CaseFieldRow } from './case-field-row';

interface CaseFieldsFormProps {
  fields: CorrectionFieldDescriptor[];
  /** Estado de validación por id de campo (para pintar cada fila y los conteos). */
  validations: Map<string, FieldValidation>;
  /** Nº de incidencias (errores/advertencias) por grupo, para el badge del tab. */
  groupIssues: Record<CorrectionGroup, number>;
  activeGroup: CorrectionGroup;
  onSelectGroup: (group: CorrectionGroup) => void;
  activeFieldId: string | null;
  onFocusField: (id: string) => void;
  fieldRefs: React.RefObject<Record<string, HTMLDivElement | null>>;
}

/** Formulario del expediente por grupos (tabs) + filas de campo. */
export function CaseFieldsForm({
  fields,
  validations,
  groupIssues,
  activeGroup,
  onSelectGroup,
  activeFieldId,
  onFocusField,
  fieldRefs,
}: CaseFieldsFormProps) {
  const activeFields = fields.filter((f) => f.group === activeGroup);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="mb-2 flex items-center gap-2 font-heading text-[13.5px] font-semibold text-ink-primary">
        <ListChecks className="size-3.5 text-primary" />
        Campos del expediente
        <span className="ml-auto font-data text-[10.5px] font-normal text-ink-muted">
          Click sobre un DNI para ver su documento
        </span>
      </div>

      {/* Tabs de grupo */}
      <div className="mb-2.5 flex shrink-0 flex-wrap gap-1.5">
        {CORRECTION_GROUPS.map((group) => {
          const active = group === activeGroup;
          const issues = groupIssues[group] ?? 0;
          return (
            <button
              key={group}
              type="button"
              onClick={() => onSelectGroup(group)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 font-sans text-xs font-medium whitespace-nowrap transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-white text-ink-secondary hover:bg-muted'
              )}
            >
              {group}
              {issues > 0 && (
                <span
                  className={cn(
                    'inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-data text-[9.5px] font-bold',
                    active
                      ? 'bg-overlay-white40 text-primary-foreground'
                      : 'bg-error-light text-error-dark'
                  )}
                >
                  {issues}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {activeFields.map((field) => {
          const validation = validations.get(field.id);
          return (
            <CaseFieldRow
              key={field.id}
              field={field}
              status={validation?.status ?? 'ok'}
              message={validation?.message ?? null}
              isActive={activeFieldId === field.id}
              onFocus={() => onFocusField(field.id)}
              registerRef={(el) => {
                fieldRefs.current[field.id] = el;
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
