"use client";

import { useState, useRef, useEffect } from "react";
import { X, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

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

const DIAS_SEMANA = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

const ANIO_MIN = 1900;

/** Convierte ISO YYYY-MM-DD → Date (local, sin zona horaria). */
function isoToDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Convierte Date → ISO YYYY-MM-DD (local). */
function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Formatea Date → dd/mm/aaaa para mostrar en el input. */
function formatDisplay(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Días del mes para el grid del calendario (incluye días de relleno). */
function getCalendarDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: Date[] = [];
  // Rellenar días previos del mes anterior (para alinear lunes)
  const startDow = (first.getDay() + 6) % 7; // 0=Lunes
  for (let i = startDow - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  // Rellenar días siguientes del mes siguiente
  const endDow = (last.getDay() + 6) % 7;
  for (let i = 1; i <= 6 - endDow; i++) {
    days.push(new Date(year, month + 1, i));
  }
  return days;
}

/** `YYYY-MM-DD` → `dd/mm/aaaa` para mostrar. Devuelve `""` si no hay fecha. */
export function isoToDdMmYyyy(iso: string | null | undefined): string {
  const d = isoToDate(iso);
  if (!d) return "";
  return formatDisplay(d);
}

interface DatePickerProps {
  /** Valor en ISO `YYYY-MM-DD` (o vacío). */
  value?: string | null;
  /** Emite ISO `YYYY-MM-DD`, o `""` si se borra. */
  onChange: (iso: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  triggerClassName?: string;
  id?: string;
  /** Año mínimo seleccionable. */
  minYear?: number;
  /** Año máximo seleccionable. */
  maxYear?: number;
}

/**
 * DatePicker: un solo input con calendario popup en español.
 *
 * - Muestra `dd/mm/aaaa` en el input.
 * - El calendario muestra nombres de meses/días en español.
 * - Valor del formulario y API: ISO `YYYY-MM-DD`.
 * - Navegación por teclado (flechas, Home, End).
 * - Botón para borrar la fecha.
 */
export function DatePicker({
  value,
  onChange,
  onBlur,
  disabled,
  invalid,
  className,
  triggerClassName,
  id,
  minYear = ANIO_MIN,
  maxYear = new Date().getFullYear(),
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => isoToDate(value) || new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(isoToDate(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const prevValueRef = useRef(value);

  // Sincronizar con value externo (controlled component pattern)
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      const d = isoToDate(value);
      if (d) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- controlled component sync
        setSelectedDate(d);
        setViewDate(d);
      } else {
        setSelectedDate(null);
      }
    }
  }, [value]);

  const handleDayClick = (day: Date) => {
    // Solo días del mes actual
    if (day.getMonth() !== viewDate.getMonth()) return;
    const min = new Date(minYear, 0, 1);
    const max = new Date(maxYear, 11, 31);
    if (day < min || day > max) return;

    setSelectedDate(day);
    onChange(dateToIso(day));
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(null);
    onChange("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedDate) return;
    let newDate = new Date(selectedDate);
    switch (e.key) {
      case "ArrowLeft":
        newDate.setDate(newDate.getDate() - 1);
        break;
      case "ArrowRight":
        newDate.setDate(newDate.getDate() + 1);
        break;
      case "ArrowUp":
        newDate.setDate(newDate.getDate() - 7);
        break;
      case "ArrowDown":
        newDate.setDate(newDate.getDate() + 7);
        break;
      case "Home":
        newDate.setDate(1);
        break;
      case "End":
        newDate.setDate(new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate());
        break;
      default:
        return;
    }
    e.preventDefault();
    // Clampear al mes visible
    if (newDate.getMonth() !== viewDate.getMonth()) {
      const lastDay = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
      newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), Math.min(newDate.getDate(), lastDay));
    }
    const min = new Date(minYear, 0, 1);
    const max = new Date(maxYear, 11, 31);
    if (newDate >= min && newDate <= max) {
      setSelectedDate(newDate);
      onChange(dateToIso(newDate));
      if (newDate.getMonth() !== viewDate.getMonth()) {
        setViewDate(newDate);
      }
    }
  };

  const prevMonth = () => setViewDate((d: Date) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate((d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const days = getCalendarDays(viewDate.getFullYear(), viewDate.getMonth());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative", className)}>
          <input
            ref={inputRef}
            id={id}
            type="text"
            readOnly
            disabled={disabled}
            aria-invalid={invalid || undefined}
            aria-label="Fecha de nacimiento"
            placeholder="dd/mm/aaaa"
            value={selectedDate ? formatDisplay(selectedDate) : ""}
            onClick={(e) => { e.stopPropagation(); if (!disabled) setOpen(true); }}
            onBlur={onBlur}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full h-8 px-3 py-1.5 font-data text-[12.5px] bg-white border rounded-md",
              "placeholder:text-ink-muted/60",
              "disabled:bg-slate-50 disabled:text-ink-muted/80 disabled:cursor-not-allowed",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              invalid && "border-error focus:border-error focus:ring-error/20",
              triggerClassName
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
            aria-label={open ? "Cerrar calendario" : "Abrir calendario"}
          >
            <Calendar className="size-4" />
          </Button>
          {selectedDate && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-8 top-1/2 -translate-y-1/2 text-ink-muted hover:text-error disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={disabled}
              onClick={handleClear}
              aria-label="Borrar fecha"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" sideOffset={4} align="start">
        <div className="w-64 p-3">
          {/* Header mes/año */}
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={prevMonth}
              disabled={viewDate.getFullYear() <= minYear && viewDate.getMonth() === 0}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="font-heading text-sm font-medium text-ink-primary capitalize">
              {MESES[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={nextMonth}
              disabled={viewDate.getFullYear() >= maxYear && viewDate.getMonth() === 11}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-0.5 mb-1 text-center">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="font-sans text-[10px] font-medium text-ink-muted py-0.5">
                {d}
              </div>
            ))}
          </div>

          {/* Grid de días */}
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day, i) => {
              const isCurrentMonth = day.getMonth() === viewDate.getMonth();
              const isSelected = selectedDate && day.getTime() === selectedDate.getTime();
              const isToday = day.getTime() === today.getTime();
              const isDisabled =
                !isCurrentMonth ||
                day < new Date(minYear, 0, 1) ||
                day > new Date(maxYear, 11, 31);

              return (
                <button
                  key={`${day.getTime()}-${i}`}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  disabled={isDisabled}
                  className={cn(
                    "h-8 w-full rounded-md font-data text-[12px] transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-primary/30",
                    isDisabled
                      ? "text-ink-muted/30 cursor-not-allowed"
                      : isSelected
                      ? "bg-primary text-white hover:bg-primary/90"
                      : isToday
                      ? "font-bold text-primary ring-1 ring-primary hover:bg-primary/5"
                      : "text-ink-secondary hover:bg-accent hover:text-ink-primary"
                  )}
                  aria-selected={isSelected ? "true" : "false"}
                  aria-current={isToday ? "date" : undefined}
                  aria-disabled={isDisabled}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}