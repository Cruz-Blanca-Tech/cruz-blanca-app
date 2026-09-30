"use client";

import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

/**
 * Selector de fecha en español (día / mes / año) que muestra y devuelve
 * `dd/mm/aaaa`.
 *
 * El `<input type="date">` nativo delegaba el formato y el calendario al idioma
 * del navegador: en una máquina en inglés se veía `mm/dd/yyyy` y el popup de
 * selección salía en inglés. Este control no depende del locale: los meses se
 * listan en español y el valor siempre se compone como `dd/mm/aaaa`.
 *
 * El valor del formulario y el de la API siguen siendo ISO `YYYY-MM-DD`; la
 * conversión ocurre solo en los bordes de este componente.
 */

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

const ANIO_MIN = 1900;

/** Días del mes `month` (1-12) del año `year`, contemplando años bisiestos. */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** `YYYY-MM-DD` → partes editables. Devuelve cadenas vacías si no hay fecha. */
function isoToParts(iso: string | null | undefined) {
  if (!iso) return { dia: "", mes: "", anio: "" };
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return { dia: "", mes: "", anio: "" };
  return {
    anio: m[1],
    // Sin ceros a la izquierda: son valores de <Select>, no texto de pantalla.
    mes: String(Number(m[2])),
    dia: String(Number(m[3])),
  };
}

/** `YYYY-MM-DD` → `dd/mm/aaaa` para mostrar. Devuelve `""` si no hay fecha. */
export function isoToDdMmYyyy(iso: string | null | undefined): string {
  const { dia, mes, anio } = isoToParts(iso);
  if (!dia || !mes || !anio) return "";
  return `${dia.padStart(2, "0")}/${mes.padStart(2, "0")}/${anio}`;
}

interface DateFieldProps {  /** Fecha en ISO `YYYY-MM-DD` (o vacío). */
  value?: string | null;
  /** Emite ISO `YYYY-MM-DD`, o `""` si la fecha está incompleta. */
  onChange: (iso: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  /** Clases extra para cada uno de los tres disparadores. */
  triggerClassName?: string;
  id?: string;
}

/**
 * Rango de años: del año en curso hacia atrás. El beneficiario es menor de
 * edad, pero el mismo control se reutiliza para adultos, así que el rango es
 * amplio y no impone una hipótesis de edad.
 */
function buildYears(): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current; y >= ANIO_MIN; y--) years.push(y);
  return years;
}

export function DateField({
  value,
  onChange,
  onBlur,
  disabled,
  invalid,
  className,
  triggerClassName,
  id,
}: DateFieldProps) {
  const { dia, mes, anio } = isoToParts(value);

  /** Compone el ISO desde las tres partes, recortando el día a un día válido. */
  const emit = (y: string, m: string, d: string) => {
    if (!y || !m || !d) {
      onChange("");
      return;
    }
    const year = Number(y);
    const month = Number(m);
    const day = Math.min(Math.max(Number(d), 1), daysInMonth(year, month));
    onChange(`${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  };

  // Sin mes o año elegidos no se puede acotar el rango del día, así que se
  // ofrecen los 31 posibles.
  const maxDia =
    mes && anio ? daysInMonth(Number(anio), Number(mes)) : 31;
  const dias = Array.from({ length: maxDia }, (_, i) => i + 1);
  const anios = buildYears();

  const etiqueta = (v: string) => (v ? v : null);

  const triggerProps = {
    disabled,
    "aria-invalid": invalid || undefined,
    className: cn("h-8 px-2 font-data text-[12.5px]", triggerClassName),
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onBlur,
  } as const;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Select
        value={dia || null}
        onValueChange={(v) => emit(anio, mes, v ?? "")}
      >
        <SelectTrigger {...triggerProps} id={id} aria-label="Día">
          <SelectValue placeholder="Día">{etiqueta(dia)}</SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {dias.map((d) => (
            <SelectItem key={d} value={String(d)} className="font-data">
              {String(d).padStart(2, "0")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="select-none text-ink-muted" aria-hidden="true">
        /
      </span>

      <Select
        value={mes || null}
        onValueChange={(v) => emit(anio, v ?? "", dia)}
      >
        <SelectTrigger {...triggerProps} aria-label="Mes">
          <SelectValue placeholder="Mes">
            {mes ? MESES[Number(mes) - 1] : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {MESES.map((nombre, i) => (
            <SelectItem key={nombre} value={String(i + 1)}>
              {nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="select-none text-ink-muted" aria-hidden="true">
        /
      </span>

      <Select
        value={anio || null}
        onValueChange={(v) => emit(v ?? "", mes, dia)}
      >
        <SelectTrigger {...triggerProps} aria-label="Año">
          <SelectValue placeholder="Año">{etiqueta(anio)}</SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {anios.map((y) => (
            <SelectItem key={y} value={String(y)} className="font-data">
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange("");
          }}
          disabled={disabled}
          aria-label="Borrar la fecha"
          className="ml-0.5 shrink-0 rounded-sm p-0.5 text-ink-muted transition-colors hover:bg-muted hover:text-ink-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="size-3" />
        </button>
      ) : null}
    </div>
  );
}
