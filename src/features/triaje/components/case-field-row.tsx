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
}

/** Fila de un campo del expediente: etiqueta + estado + control + observación. */
export function CaseFieldRow({
  field,
  status,
  message,
  isActive,
  onFocus,
  registerRef,
}: CaseFieldRowProps) {
  const { control } = useFormContext<CorrectionFormValues>();
  const meta = STATUS_META[status];
  const StatusIcon = meta.icon;
  const flagged = status === 'warning' || status === 'error';
  const birthDate = useWatch<CorrectionFormValues>({
    control,
    name: 'beneficiary.birth_date',
  });
  // Adultos vivos del form: los selectores de rol (apoderado/emergencia) derivan
  // de aquí sus opciones, para que reflejen DNIs/nombres recién corregidos. Sin
  // genérico explícito: el tipo (AdultFormValue[]) se infiere del `control`.
  const adults = useWatch({ control, name: 'adults' });

  return (
    <div
      ref={registerRef}
      onClick={onFocus}
      className={cn(
        'mb-1.5 cursor-pointer rounded-md border bg-white p-2.5 transition-colors',
        isActive
          ? 'border-primary bg-accent ring-2 ring-primary/15'
          : flagged
            ? meta.border
            : 'border-border'
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="flex items-center gap-1 font-sans text-[11.5px] font-medium text-ink-secondary">
          <StatusIcon className={cn('size-3', meta.color)} />
          {field.label}
          {field.emergency && (
            <span className="font-data text-[10px] text-error">
              · emergencia
            </span>
          )}
        </label>
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
      </div>

      {field.control === 'readonly' ? (
        <Input
          readOnly
          disabled
          value={field.derive === 'age' ? ageFromIso(String(birthDate ?? ''), new Date()) : ''}
          placeholder={field.placeholder}
          className="h-8 bg-slate-50 font-data text-[12.5px]"
        />
      ) : field.control === 'bool' ? (
        <Controller
          control={control}
          name={fieldName(field.name!)}
          render={({ field: rhf }) => (
            <BoolToggle
              value={(rhf.value as boolean | null) ?? (field.nullableBool ? null : false)}
              nullable={Boolean(field.nullableBool)}
              onChange={rhf.onChange}
            />
          )}
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
              >
                <SelectTrigger
                  className={cn('h-8 w-full font-data text-[12.5px]', flagged && meta.border)}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Base UI muestra el valor crudo por defecto; mapeamos value →
                      etiqueta del item seleccionado (nombre y rol, no el DNI). */}
                  <SelectValue placeholder="Seleccionar…">
                    {(value: string | null) => {
                      if (!value) return 'Seleccionar…';
                      const opt = options.find((o) => o.value === value);
                      return opt?.triggerLabel ?? opt?.label ?? value;
                    }}
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
        <AdultsListControl />
      ) : (
        <Controller
          control={control}
          name={fieldName(field.name!)}
          render={({ field: rhf }) => (
            <Input
              type={field.control === 'date' ? 'date' : 'text'}
              value={(rhf.value as string) ?? ''}
              onChange={rhf.onChange}
              onBlur={rhf.onBlur}
              onClick={(e) => e.stopPropagation()}
              onFocus={onFocus}
              placeholder={field.placeholder ?? 'Ingresar manualmente…'}
              className={cn('h-8 font-data text-[12.5px]', flagged && meta.border)}
            />
          )}
        />
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
    </div>
  );
}
