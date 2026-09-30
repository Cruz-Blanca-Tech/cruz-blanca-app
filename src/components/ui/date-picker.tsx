"use client";

import { useState, useRef, useEffect } from "react";
import { X, Calendar, ChevronLeft, ChevronRight, ChevronDown, Search } from "lucide-react";

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
 * - Permite buscar y seleccionar rápidamente por mes y por año.
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
  const [pickerView, setPickerView] = useState<"days" | "month" | "year">("days");
  const [monthQuery, setMonthQuery] = useState("");
  const [yearQuery, setYearQuery] = useState("");
  const [viewDate, setViewDate] = useState(() => isoToDate(value) || new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(isoToDate(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);
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

  // Al abrir el selector de años, desplazar hacia el año activo
  useEffect(() => {
    if (open && pickerView === "year" && yearListRef.current) {
      const activeBtn = yearListRef.current.querySelector<HTMLButtonElement>(
        '[data-active="true"]'
      );
      if (activeBtn) {
        activeBtn.scrollIntoView({ block: "center" });
      }
    }
  }, [open, pickerView]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setPickerView("days");
      setMonthQuery("");
      setYearQuery("");
    }
  };

  const applyMonthYearChange = (nextYear: number, nextMonth: number) => {
    setViewDate(new Date(nextYear, nextMonth, 1));
    if (selectedDate) {
      const maxDayInTarget = new Date(nextYear, nextMonth + 1, 0).getDate();
      const clampedDay = Math.min(selectedDate.getDate(), maxDayInTarget);
      const updated = new Date(nextYear, nextMonth, clampedDay);
      const min = new Date(minYear, 0, 1);
      const max = new Date(maxYear, 11, 31);
      if (updated >= min && updated <= max) {
        setSelectedDate(updated);
        onChange(dateToIso(updated));
      }
    }
  };

  const handleMonthSelect = (monthIndex: number) => {
    applyMonthYearChange(viewDate.getFullYear(), monthIndex);
    setPickerView("days");
    setMonthQuery("");
  };

  const handleYearSelect = (year: number) => {
    applyMonthYearChange(year, viewDate.getMonth());
    setPickerView("days");
    setYearQuery("");
  };

  const handleDayClick = (day: Date) => {
    // Solo días del mes actual
    if (day.getMonth() !== viewDate.getMonth()) return;
    const min = new Date(minYear, 0, 1);
    const max = new Date(maxYear, 11, 31);
    if (day < min || day > max) return;

    setSelectedDate(day);
    onChange(dateToIso(day));
    handleOpenChange(false);
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

  const years: number[] = [];
  for (let y = maxYear; y >= minYear; y--) {
    years.push(y);
  }

  const normalizedMonthQuery = monthQuery.trim().toLowerCase();
  const filteredMonths = MESES.map((name, index) => ({ name, index })).filter(
    ({ name, index }) =>
      !normalizedMonthQuery ||
      name.includes(normalizedMonthQuery) ||
      String(index + 1).includes(normalizedMonthQuery)
  );

  const normalizedYearQuery = yearQuery.trim();
  const filteredYears = years.filter(
    (y) => !normalizedYearQuery || String(y).includes(normalizedYearQuery)
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
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
            onClick={(e) => { e.stopPropagation(); if (!disabled) handleOpenChange(true); }}
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
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenChange(!open); }}
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
          <div className="flex items-center justify-between gap-1 mb-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={prevMonth}
              disabled={
                pickerView !== "days" ||
                (viewDate.getFullYear() <= minYear && viewDate.getMonth() === 0)
              }
              aria-label="Mes anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setPickerView((v) => (v === "month" ? "days" : "month"));
                  setMonthQuery("");
                }}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-1 font-heading text-xs font-medium capitalize transition-colors",
                  pickerView === "month"
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-ink-primary hover:bg-slate-200/80"
                )}
                aria-label="Buscar o seleccionar mes"
                aria-expanded={pickerView === "month"}
              >
                {MESES[viewDate.getMonth()]}
                <ChevronDown
                  className={cn(
                    "size-3 opacity-70 transition-transform",
                    pickerView === "month" && "rotate-180 opacity-100"
                  )}
                />
              </button>

              <button
                type="button"
                onClick={() => {
                  setPickerView((v) => (v === "year" ? "days" : "year"));
                  setYearQuery("");
                }}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-1 font-data text-xs font-semibold transition-colors",
                  pickerView === "year"
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-ink-primary hover:bg-slate-200/80"
                )}
                aria-label="Buscar o seleccionar año"
                aria-expanded={pickerView === "year"}
              >
                {viewDate.getFullYear()}
                <ChevronDown
                  className={cn(
                    "size-3 opacity-70 transition-transform",
                    pickerView === "year" && "rotate-180 opacity-100"
                  )}
                />
              </button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={nextMonth}
              disabled={
                pickerView !== "days" ||
                (viewDate.getFullYear() >= maxYear && viewDate.getMonth() === 11)
              }
              aria-label="Mes siguiente"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {pickerView === "month" && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-ink-muted" />
                <input
                  type="text"
                  autoFocus
                  value={monthQuery}
                  onChange={(e) => setMonthQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && filteredMonths.length > 0) {
                      e.preventDefault();
                      handleMonthSelect(filteredMonths[0].index);
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setPickerView("days");
                    }
                  }}
                  placeholder="Buscar mes (ej. marzo o 3)..."
                  className="h-7 w-full rounded-md border border-slate-200 bg-white pl-8 pr-2 text-xs text-ink-primary placeholder:text-ink-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {filteredMonths.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {filteredMonths.map(({ name, index }) => {
                    const isCurrent = index === viewDate.getMonth();
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleMonthSelect(index)}
                        className={cn(
                          "h-8 rounded-md px-1.5 text-xs capitalize transition-colors",
                          isCurrent
                            ? "bg-primary font-semibold text-white"
                            : "text-ink-secondary hover:bg-accent hover:text-ink-primary"
                        )}
                      >
                        {name.slice(0, 3)}.
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="py-4 text-center text-xs text-ink-muted">
                  Sin coincidencias
                </p>
              )}
            </div>
          )}

          {pickerView === "year" && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-ink-muted" />
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  value={yearQuery}
                  onChange={(e) => setYearQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && filteredYears.length > 0) {
                      e.preventDefault();
                      const exact = Number(yearQuery.trim());
                      if (filteredYears.includes(exact)) {
                        handleYearSelect(exact);
                      } else {
                        handleYearSelect(filteredYears[0]);
                      }
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setPickerView("days");
                    }
                  }}
                  placeholder="Buscar año (ej. 2016)..."
                  className="h-7 w-full rounded-md border border-slate-200 bg-white pl-8 pr-2 font-data text-xs text-ink-primary placeholder:font-sans placeholder:text-ink-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {filteredYears.length > 0 ? (
                <div
                  ref={yearListRef}
                  className="grid max-h-48 grid-cols-3 gap-1 overflow-y-auto pr-1"
                >
                  {filteredYears.map((y) => {
                    const isCurrent = y === viewDate.getFullYear();
                    return (
                      <button
                        key={y}
                        type="button"
                        data-active={isCurrent ? "true" : undefined}
                        onClick={() => handleYearSelect(y)}
                        className={cn(
                          "h-8 rounded-md font-data text-xs transition-colors",
                          isCurrent
                            ? "bg-primary font-semibold text-white"
                            : "text-ink-secondary hover:bg-accent hover:text-ink-primary"
                        )}
                      >
                        {y}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="py-4 text-center text-xs text-ink-muted">
                  Sin coincidencias
                </p>
              )}
            </div>
          )}

          {pickerView === "days" && (
            <>
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
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}