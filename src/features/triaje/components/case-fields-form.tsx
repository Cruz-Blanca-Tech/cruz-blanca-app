'use client';

import { ListChecks, User, Users, BookOpen, HeartPulse, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';

import { cn } from '@/lib/utils';
import type {
  CorrectionFieldDescriptor,
  FieldValidation,
} from '../lib/correction-fields';
import { CORRECTION_GROUPS, type CorrectionGroup } from '../lib/correction-form';
import { CaseFieldRow } from './case-field-row';

const GROUP_ICONS: Record<CorrectionGroup, LucideIcon | null> = {
  'Beneficiario': User,
  'Contactos y Apoderado': Users,
  'Educación': BookOpen,
  'Salud': HeartPulse,
  'Religión y permisos': ShieldCheck,
  'Padre': null,
  'Madre': null,
  'Apoderado': null,
  'Otro': null,
};

interface CaseFieldsFormProps {
  fields: CorrectionFieldDescriptor[];
  validations: Map<string, FieldValidation>;
  groupIssues: Record<CorrectionGroup, number>;
  activeGroup: CorrectionGroup;
  onSelectGroup: (group: CorrectionGroup) => void;
  activeFieldId: string | null;
  onFocusField: (id: string) => void;
  fieldRefs: React.RefObject<Record<string, HTMLDivElement | null>>;
  disabled?: boolean;
  /**
   * Ids de campos protegidos cuando el beneficiario YA está registrado en MDM:
   * se renderizan bloqueados (valores del maestro, no editables). `null` = sin
   * match, edición normal.
   */
  lockedFieldIds?: Set<string> | null;
  /**
   * Bloques padre/madre del editor de adultos cuando hay match MDM: sus filas
   * quedan bloqueadas (solo el tutor/OTHER se puede editar/agregar/eliminar).
   */
  parentsLocked?: boolean;
  /**
   * Línea ancla bajo el campo DNI (info con match MDM / warning por agrupación
   * del lote). Reactiva al valor del DNI; se renderiza solo en la fila del DNI.
   */
  dniInline?: { kind: 'info' | 'warning'; text: string } | null;
  /**
   * Verificación MDM en curso para el DNI del beneficiario (debounce de 350ms +
   * fetch): muestra un spinner "Buscando en MDM…" dentro del campo DNI mientras
   * se consulta el maestro.
   */
  isMdmMatching?: boolean;
}

function ConditionalFieldWrapper({
  field,
  children,
}: {
  field: CorrectionFieldDescriptor;
  children: React.ReactNode;
}) {
  const { control } = useFormContext();
  const showIf = field.showIf!;
  const watchedValue = useWatch({ control, name: showIf.name });

  if (watchedValue !== showIf.equals) return null;
  return <>{children}</>;
}

export function CaseFieldsForm({
  fields,
  validations,
  groupIssues,
  activeGroup,
  onSelectGroup,
  activeFieldId,
  onFocusField,
  fieldRefs,
  disabled = false,
  lockedFieldIds = null,
  parentsLocked = false,
  dniInline = null,
  isMdmMatching = false,
}: CaseFieldsFormProps) {
  const activeFields = fields.filter((f) => f.group === activeGroup);

  // Agrupar campos por `cardGroup`. Los que no tienen van al grupo 'default'.
  const groupedFields = activeFields.reduce((acc, field) => {
    const groupName = field.cardGroup || 'default';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(field);
    return acc;
  }, {} as Record<string, CorrectionFieldDescriptor[]>);

  const renderField = (field: CorrectionFieldDescriptor) => {
    const validation = validations.get(field.id);
    const row = (
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
        disabled={disabled}
        locked={lockedFieldIds?.has(field.id) ?? false}
        parentsLocked={parentsLocked}
        dniInline={field.id === 'beneficiary.dni' ? dniInline : null}
        isMdmMatching={field.id === 'beneficiary.dni' ? isMdmMatching : false}
      />
    );

    if (field.showIf) {
      return (
        <ConditionalFieldWrapper key={field.id} field={field}>
          {row}
        </ConditionalFieldWrapper>
      );
    }
    return row;
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="mb-2 flex items-center gap-2 font-heading text-[13.5px] font-semibold text-ink-primary">
        <ListChecks className="size-3.5 text-primary" />
        Campos del expediente
      </div>

      <div className="mb-2.5 flex shrink-0 flex-wrap gap-1.5">
        {CORRECTION_GROUPS.map((group) => {
          const active = group === activeGroup;
          const issues = groupIssues[group] ?? 0;
          const GroupIcon = GROUP_ICONS[group];
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
              {GroupIcon && <GroupIcon className="size-3.5" />}
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

      <div className="flex-1 overflow-y-auto pr-1 space-y-4 pb-4">
        {Object.entries(groupedFields).map(([cardName, fieldsInGroup]) => {
          if (cardName === 'default') {
            return (
              <div key={cardName} className="space-y-1.5">
                {fieldsInGroup.map(renderField)}
              </div>
            );
          }

          const isGridCard = cardName === 'Alergias, Enfermedades y Vacunas';

          return (
            <div
              key={cardName}
              className="rounded-xl border bg-slate-50/50 p-3 shadow-sm space-y-2.5"
            >
              <h4 className="font-heading text-[11px] font-bold uppercase tracking-wider text-ink-muted/80 ml-1">
                {cardName}
              </h4>
              <div className={cn(
                isGridCard ? "grid grid-cols-1 2xl:grid-cols-3 xl:grid-cols-2 gap-2" : "space-y-1.5"
              )}>
                {fieldsInGroup.map(renderField)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
