'use client';

import { useState } from 'react';
import {
  Controller,
  useFormContext,
  useWatch,
  type FieldPath,
} from 'react-hook-form';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  OctagonAlert,
  Pencil,
  Plus,
  TriangleAlert,
  X,
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
import { ageFromIso } from '../lib/correction-fields';
import type { CorrectionFormValues } from '../lib/correction-form';

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

/** Control segmentado Sí/No (con opción "sin definir" para booleanos nullable). */
function BoolToggle({
  value,
  nullable,
  onChange,
}: {
  value: boolean | null;
  nullable: boolean;
  onChange: (v: boolean | null) => void;
}) {
  const options: { v: boolean; label: string; active: string }[] = [
    { v: true, label: 'Sí', active: 'border-success bg-success text-white' },
    { v: false, label: 'No', active: 'border-error bg-error text-white' },
  ];
  return (
    <div className="flex gap-1.5">
      {options.map((o) => {
        const selected = value === o.v;
        return (
          <button
            key={String(o.v)}
            type="button"
            onClick={() => onChange(selected && nullable ? null : o.v)}
            className={cn(
              'flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border font-sans text-sm font-semibold transition-colors',
              selected
                ? o.active
                : 'border-border bg-white text-ink-secondary hover:bg-muted'
            )}
          >
            {selected && (o.v ? <Check className="size-3.5" /> : <X className="size-3.5" />)}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Multi-select con opciones fijas + valores libres ("Otros"). */
function MultiSelect({
  options,
  value,
  onChange,
  otrosLabel = 'Otros',
  freeform = false,
}: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  otrosLabel?: string;
  freeform?: boolean;
}) {
  const [draft, setDraft] = useState('');
  const [showInput, setShowInput] = useState(false);

  const norm = (v: string) => v.toLowerCase().replace(/[.\s]/g, '');
  const optNorms = options.map(norm);
  const custom = value.filter((v) => !optNorms.includes(norm(v)));
  const isSelected = (opt: string) => value.some((v) => norm(v) === norm(opt));

  const toggle = (opt: string) =>
    onChange(
      isSelected(opt)
        ? value.filter((v) => norm(v) !== norm(opt))
        : [...value, opt]
    );
  const addCustom = () => {
    const t = draft.trim();
    if (t && !value.some((v) => norm(v) === norm(t))) onChange([...value, t]);
    setDraft('');
  };
  const removeCustom = (c: string) => onChange(value.filter((v) => v !== c));

  return (
    <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const selected = isSelected(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-sans text-xs font-medium transition-colors',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-white text-ink-secondary hover:bg-muted'
              )}
            >
              {selected && <Check className="size-3" />}
              {opt}
            </button>
          );
        })}
        {custom.map((c) => (
          <span
            key={c}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border py-1 pr-1.5 pl-2.5 font-sans text-xs font-medium',
              freeform
                ? 'border-primary bg-brand-100 text-brand-dark'
                : 'border-program-familia bg-program-familia-light text-program-familia-dark'
            )}
          >
            {c}
            <button
              type="button"
              onClick={() => removeCustom(c)}
              className="inline-flex"
              aria-label={`Quitar ${c}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => setShowInput((s) => !s)}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-1 font-sans text-xs font-medium transition-colors',
            showInput
              ? 'border-primary text-primary'
              : 'border-border text-ink-muted hover:text-primary'
          )}
        >
          <Plus className="size-3" />
          {otrosLabel}
        </button>
      </div>
      {showInput && (
        <div className="flex gap-1.5">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="Especificar y presionar Enter…"
            className="h-8 font-data text-[12.5px]"
            autoFocus
          />
          <button
            type="button"
            onClick={addCustom}
            className="shrink-0 rounded-md bg-primary px-3 font-sans text-[12.5px] font-medium text-primary-foreground"
          >
            Agregar
          </button>
        </div>
      )}
    </div>
  );
}

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
          render={({ field: rhf }) => (
            <Select
              value={(rhf.value as string) || null}
              onValueChange={(value) => rhf.onChange(value ?? '')}
            >
              <SelectTrigger
                className={cn('h-8 w-full font-data text-[12.5px]', flagged && meta.border)}
                onClick={(e) => e.stopPropagation()}
              >
                <SelectValue placeholder="Seleccionar…" />
              </SelectTrigger>
              <SelectContent>
                {field.selectOptions?.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
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
