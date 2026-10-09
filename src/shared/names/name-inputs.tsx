'use client';

import { useState } from 'react';

import { Input } from '@/components/ui/input';
import {
  composeFullName,
  composeSurnames,
  splitFullName,
  splitSurnames,
  type FullNameParts,
  type SurnameParts,
} from './name-parts';

/**
 * HU-004: captura de apellidos (y del nombre completo de adultos) en campos
 * separados. El valor que recibe y emite sigue siendo el string del maestro
 * ("PATERNO MATERNO" o "NOMBRES PATERNO MATERNO"), así que el componente se
 * conecta a cualquier campo existente de react-hook-form sin cambiar el
 * modelo de datos ni el backend.
 *
 * Mantiene sus partes en estado local para no "mover" texto entre campos
 * mientras se escribe; solo vuelve a dividir el valor cuando cambia desde fuera
 * (p. ej. al cargar el expediente o aplicar una sugerencia del maestro).
 */

interface BaseProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  disabled?: boolean;
  invalid?: boolean;
  inputClassName?: string;
  /** Muestra etiquetas pequeñas sobre cada campo. */
  showLabels?: boolean;
}

const norm = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

function useSyncedParts<T>(value: string | null | undefined, split: (v: string) => T, compose: (p: T) => string) {
  const [parts, setParts] = useState<T>(() => split(norm(value)));
  const [synced, setSynced] = useState(norm(value));
  // Patrón "ajustar estado cuando cambia una prop" (sin efecto): si el valor
  // externo cambió y no coincide con lo que estas partes producen, se re-divide.
  if (norm(value) !== synced) {
    setSynced(norm(value));
    if (compose(parts) !== norm(value)) setParts(split(norm(value)));
  }
  return [parts, setParts] as const;
}

function Labeled({ label, show, children }: { label: string; show?: boolean; children: React.ReactNode }) {
  if (!show) return <>{children}</>;
  return (
    <div className="flex flex-col gap-1">
      <span className="font-sans text-[10.5px] font-semibold text-ink-secondary">{label}</span>
      {children}
    </div>
  );
}

export function SurnameInputs({
  value,
  onChange,
  onBlur,
  onFocus,
  disabled,
  invalid,
  inputClassName,
  showLabels,
}: BaseProps) {
  const [parts, setParts] = useSyncedParts<SurnameParts>(value, splitSurnames, (p) => composeSurnames(p.paternal, p.maternal));

  const update = (next: SurnameParts) => {
    setParts(next);
    onChange(composeSurnames(next.paternal, next.maternal));
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <Labeled label="Apellido paterno" show={showLabels}>
        <Input
          aria-label="Apellido paterno"
          aria-invalid={invalid || undefined}
          value={parts.paternal}
          onChange={(e) => update({ ...parts, paternal: e.target.value })}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          placeholder="Apellido paterno"
          className={inputClassName}
        />
      </Labeled>
      <Labeled label="Apellido materno" show={showLabels}>
        <Input
          aria-label="Apellido materno"
          value={parts.maternal}
          onChange={(e) => update({ ...parts, maternal: e.target.value })}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          placeholder="Apellido materno"
          className={inputClassName}
        />
      </Labeled>
    </div>
  );
}

export function FullNameInputs({
  value,
  onChange,
  onBlur,
  onFocus,
  disabled,
  invalid,
  inputClassName,
  showLabels,
}: BaseProps) {
  const [parts, setParts] = useSyncedParts<FullNameParts>(value, splitFullName, (p) =>
    composeFullName(p.givenNames, p.paternal, p.maternal)
  );

  const update = (next: FullNameParts) => {
    setParts(next);
    onChange(composeFullName(next.givenNames, next.paternal, next.maternal));
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <Labeled label="Nombres" show={showLabels}>
        <Input
          aria-label="Nombres"
          aria-invalid={invalid || undefined}
          value={parts.givenNames}
          onChange={(e) => update({ ...parts, givenNames: e.target.value })}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          placeholder="Nombres"
          className={inputClassName}
        />
      </Labeled>
      <Labeled label="Apellido paterno" show={showLabels}>
        <Input
          aria-label="Apellido paterno"
          aria-invalid={invalid || undefined}
          value={parts.paternal}
          onChange={(e) => update({ ...parts, paternal: e.target.value })}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          placeholder="Apellido paterno"
          className={inputClassName}
        />
      </Labeled>
      <Labeled label="Apellido materno" show={showLabels}>
        <Input
          aria-label="Apellido materno"
          value={parts.maternal}
          onChange={(e) => update({ ...parts, maternal: e.target.value })}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          placeholder="Apellido materno"
          className={inputClassName}
        />
      </Labeled>
    </div>
  );
}
