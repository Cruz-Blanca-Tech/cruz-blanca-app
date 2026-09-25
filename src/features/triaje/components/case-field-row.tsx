'use client';

import {
  Controller,
  useFormContext,
  useWatch,
  type FieldPath,
} from 'react-hook-form';
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  OctagonAlert,
  Pencil,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  CorrectionFieldDescriptor,
  FieldStatus,
} from '../lib/correction-fields';
import { ageFromIso, buildAdultRefOptions } from '../lib/correction-fields';
import type { CorrectionFormValues } from '../lib/correction-form';
import { BoolToggle } from './bool-toggle';
import { MultiSelect } from './multi-select';
import { AdultsListControl } from './adults-list-control';
import { SchoolSelect } from '@/features/mdm/components/school-select';
import { isBeneficiaryMinor } from '@/lib/domain/beneficiary-rules';

interface StatusMeta {
  icon: LucideIcon;
  label: string;
  /** Clase de color del texto/icono. */
  color: string;
  /** Clase de fondo del chip. */
  chipBg: string;
  /** Clase del borde del input cuando el campo está marcado. */
  border: string;
}

const STATUS_META: Record<FieldStatus, StatusMeta> = {
  ok: {
    icon: CheckCircle2,
    label: 'Validado',
    color: 'text-success-dark',
    chipBg: 'bg-success-light',
    border: 'border-success',
  },
  warning: {
    icon: TriangleAlert,
    label: 'Advertencia',
    color: 'text-warning-dark',
    chipBg: 'bg-warning-light',
    border: 'border-warning',
  },
  error: {
    icon: OctagonAlert,
    label: 'Error',
    color: 'text-error-dark',
    chipBg: 'bg-error-light',
    border: 'border-error',
  },
  empty: {
    icon: Pencil,
    label: 'Por completar',
    color: 'text-ink-muted',
    chipBg: 'bg-muted',
    border: 'border-border',
  },
};

const fieldName = (name: string) => name as FieldPath<CorrectionFormValues>;

interface CaseFieldRowProps {
  field: CorrectionFieldDescriptor;
  status: FieldStatus;
  message: string | null;
  isActive: boolean;
  onFocus: () => void;
  registerRef: (el: HTMLDivElement | null) => void;
  disabled?: boolean;
  /**
   * Campo protegido porque el beneficiario YA existe en MDM: el valor mostrado
   * es el del maestro y no se puede editar (indicador visual de candado).
   */
  locked?: boolean;
  /** Match MDM: bloquea las filas padre/madre del editor de adultos. */
  parentsLocked?: boolean;
  /**
   * Línea ancla de nivel info/advertencia bajo el campo DNI (única, reactiva):
   *   - info: "Registrado en MDM como X — identidad desde el maestro..." cuando
   *     el DNI del formulario tiene match MDM;
   *   - warning: agrupación del lote con DNI distinto (sin match MDM y caso
   *     editable), en sustitución del antiguo banner.
   */
  dniInline?: { kind: 'info' | 'warning'; text: string } | null;
}

/** Fila de un campo del expediente: etiqueta + estado + control + observación. */
export function CaseFieldRow({
  field,
  status,
  message,
  isActive,
  onFocus,
  registerRef,
  disabled = false,
  locked = false,
  parentsLocked = false,
  dniInline = null,
}: CaseFieldRowProps) {
  const { control } = useFormContext<CorrectionFormValues>();
  const meta = STATUS_META[status];
  const StatusIcon = meta.icon;
  const flagged = status === 'warning' || status === 'error';
  // Un campo bloqueado por MDM se trata como deshabilitado en TODOS los
  // controles (input/select/toggle), pero conserva su indicador visual propio.
  const effectiveDisabled = disabled || locked;
  const birthDate = useWatch<CorrectionFormValues>({
    control,
    name: 'beneficiary.birth_date',
  });
  // Adultos vivos del form: los selectores de rol (apoderado/emergencia) derivan
  // de aquí sus opciones, para que reflejen DNIs/nombres recién corregidos. Sin
  // genérico explícito: el tipo (AdultFormValue[]) se infiere del `control`.
  const adults = useWatch({ control, name: 'adults' });

  const isBool = field.control === 'bool';

  const statusChip = (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-sm px-1.5 py-0.5 font-data text-[9.5px] font-semibold whitespace-nowrap',
        meta.chipBg,
        meta.color
      )}
    >
      <span className={cn('size-1 rounded-full bg-current')} />
      {meta.label}
    </span>
  );

  return (
    <div
      ref={registerRef}
      onClick={onFocus}
      className={cn(
        'cursor-pointer rounded-md border bg-white p-2.5 transition-colors',
        isActive
          ? 'border-primary bg-accent ring-2 ring-primary/15'
          : flagged
            ? meta.border
            : 'border-border'
      )}
    >
      <div className={cn("flex items-center justify-between gap-2", !isBool && "mb-1.5")}>
        <label className="flex items-center gap-1 font-sans text-[11.5px] font-medium text-ink-secondary leading-tight">
          <StatusIcon className={cn('size-3 shrink-0', meta.color)} />
          {field.label}
          {locked && (
            <Lock
              className="size-2.5 shrink-0 text-info-dark"
              aria-label="Bloqueado: valor del maestro MDM (beneficiario ya registrado)"
            />
          )}
          {field.emergency && (
            <span className="font-data text-[10px] text-error shrink-0">
              • emergencia
            </span>
          )}
        </label>
        
        {isBool ? (
          <div className="flex items-center gap-2 shrink-0">
            {statusChip}
            <div className="w-[110px]">
              <Controller
                control={control}
                name={fieldName(field.name!)}
                render={({ field: rhf }) => (
                  <BoolToggle
                    value={(rhf.value as boolean | null) ?? (field.nullableBool ? null : false)}
                    nullable={Boolean(field.nullableBool)}
                    disabled={effectiveDisabled}
                    onChange={rhf.onChange}
                  />
                )}
              />
            </div>
          </div>
        ) : (
          statusChip
        )}
      </div>

      {!isBool && (
        <>
          {field.control === 'readonly' ? (
            <Input
              readOnly
              disabled
              value={field.derive === 'age' ? ageFromIso(String(birthDate ?? ''), new Date()) : ''}
              placeholder={field.placeholder}
              className="h-8 bg-slate-50 font-data text-[12.5px]"
            />
          ) : field.control === 'multi' ? (
        <Controller
          control={control}
          name={fieldName(field.name!)}
          render={({ field: rhf }) => (
            <MultiSelect
              options={field.multiOptions ?? []}
              value={(rhf.value as string[]) ?? []}
              onChange={rhf.onChange}
              otrosLabel={field.otrosLabel}
              freeform={field.freeform}
              disabled={effectiveDisabled}
            />
          )}
        />
      ) : field.control === 'select' ? (
        <Controller
          control={control}
          name={fieldName(field.name!)}
          render={({ field: rhf }) => {
            // Selectores de rol (apoderado/emergencia): opciones en vivo desde los
            // adultos del form (value = índice). El resto usa opciones estáticas.
            const options = field.adultRefSelect
              ? buildAdultRefOptions(adults ?? [])
              : field.selectOptions ?? [];
            return (
              <Select
                value={(rhf.value as string) || null}
                onValueChange={(value) => rhf.onChange(value ?? '')}
                disabled={effectiveDisabled}
              >
                <SelectTrigger
                  disabled={effectiveDisabled}
                  className={cn('h-8 w-full font-data text-[12.5px]', flagged && meta.border)}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Base UI muestra el valor crudo por defecto; mapeamos value →
                      etiqueta del item seleccionado (nombre y rol, no el DNI). */}
                  <SelectValue placeholder="Seleccionar...">
                    {(() => {
                      const val = rhf.value as string | null;
                      if (!val) return "Seleccionar...";
                      const opt = options.find((o) => o.value === val);
                      return opt?.triggerLabel ?? opt?.label ?? val;
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }}
        />
      ) : field.control === 'adults_list' ? (
        <AdultsListControl parentsLocked={parentsLocked} />
      ) : field.control === 'school_select' ? (
        <Controller
          control={control}
          name={fieldName(field.name!)}
          render={({ field: rhf }) => (
            <SchoolSelect
              value={(rhf.value as string) || ''}
              onChange={rhf.onChange}
              disabled={effectiveDisabled}
              className={cn('h-8 font-data text-[12.5px]', locked && 'bg-slate-50 text-ink-muted/80', flagged && meta.border)}
            />
          )}
        />
      ) : (
        <Controller
          control={control}
          name={fieldName(field.name!)}
          render={({ field: rhf }) => {
            const isDniField =
              field.id.toLowerCase().includes('dni') ||
              Boolean(field.name?.toLowerCase().includes('dni'));
            return (
              <Input
                type={field.control === 'date' ? 'date' : 'text'}
                inputMode={isDniField ? 'numeric' : undefined}
                maxLength={isDniField ? 8 : undefined}
                value={(rhf.value as string) ?? ''}
                onChange={(e) => {
                  if (isDniField) {
                    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 8);
                    rhf.onChange(cleaned);
                  } else {
                    rhf.onChange(e);
                  }
                }}
                onBlur={rhf.onBlur}
                onClick={(e) => e.stopPropagation()}
                onFocus={onFocus}
                disabled={effectiveDisabled}
                placeholder={field.placeholder ?? 'Ingresar manualmente…'}
                className={cn('h-8 font-data text-[12.5px]', locked && 'bg-slate-50 text-ink-muted/80', flagged && meta.border)}
              />
            );
          }}
        />
      )}
      </>
      )}

      {message ? (
        <div className="mt-1 flex items-start gap-1">
          <AlertCircle className={cn('mt-0.5 size-2.5 shrink-0', meta.color)} />
          <span className={cn('font-data text-[10.5px] leading-snug', meta.color)}>
            {message}
          </span>
        </div>
      ) : field.note ? (
        <div className="mt-1 font-data text-[10px] text-ink-muted">
          {field.note}
        </div>
      ) : null}

      {/* Línea ancla bajo el DNI: info con match MDM o warning de agrupación. */}
      {dniInline && (
        <div
          className={cn(
            'mt-1 flex items-start gap-1 rounded-sm px-1.5 py-1',
            dniInline.kind === 'warning'
              ? 'border border-warning/20 bg-warning-light'
              : 'border border-info/20 bg-info-light'
          )}
        >
          {dniInline.kind === 'warning' ? (
            <TriangleAlert className="mt-0.5 size-2.5 shrink-0 text-warning-dark" />
          ) : (
            <CheckCircle2 className="mt-0.5 size-2.5 shrink-0 text-info-dark" />
          )}
          <span
            className={cn(
              'font-data text-[10.5px] leading-snug',
              dniInline.kind === 'warning' ? 'text-warning-dark' : 'text-info-dark'
            )}
          >
            {dniInline.text}
          </span>
        </div>
      )}

      {/* Advertencia de edad: solo bajo el campo birth_date, en tiempo real */}
      {field.id === 'beneficiary.birth_date' && (() => {
        const minor = isBeneficiaryMinor(birthDate as string | null | undefined);
        if (minor === false) {
          return (
            <div className="mt-1.5 flex items-start gap-1 rounded-sm bg-error-light px-1.5 py-1">
              <AlertCircle className="mt-0.5 size-2.5 shrink-0 text-error" />
              <span className="font-data text-[10.5px] leading-snug text-error-dark">
                El beneficiario no es menor de edad. La fecha indica{' '}
                {new Date().getFullYear() - new Date(birthDate as string).getFullYear()} años o más.
              </span>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
}

