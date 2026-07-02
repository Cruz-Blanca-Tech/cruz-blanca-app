/**
 * Helpers de PRESENTACIÓN del dashboard (formateo puro para los ejes/leyendas de
 * los gráficos). No mutan la data de los hooks: reciben el valor crudo del
 * backend y devuelven una cadena legible. Viven en `components/` porque son parte
 * de la capa de UI (formateo local a la vista), no de la capa de datos.
 */

/** Abreviaturas de mes en español (índice 0 = enero). */
const MONTHS_ES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const;

/**
 * Formatea un día ISO (`YYYY-MM-DD`) a `DD mmm` (p. ej. `2026-07-01` → `01 jul`).
 * Se parsea a mano (split por `-`) para NO depender de `Date`/zona horaria: solo
 * es una etiqueta de eje. Si el formato no coincide, devuelve el valor crudo.
 */
export function formatDay(day: string): string {
  const parts = day.split('-');
  if (parts.length < 3) return day;
  const month = Number(parts[1]);
  const dd = parts[2];
  if (!month || month < 1 || month > 12) return day;
  return `${dd} ${MONTHS_ES[month - 1]}`;
}

/**
 * Formatea un mes ISO (`YYYY-MM`) a `mmm AA` (p. ej. `2026-06` → `jun 26`). Mismo
 * criterio que `formatDay`: parseo manual, sin `Date`. Fallback al valor crudo.
 */
export function formatMonth(month: string): string {
  const parts = month.split('-');
  if (parts.length < 2) return month;
  const m = Number(parts[1]);
  const yy = parts[0].slice(-2);
  if (!m || m < 1 || m > 12) return month;
  return `${MONTHS_ES[m - 1]} ${yy}`;
}

/**
 * Resuelve la etiqueta legible de una clave cruda (`status`, `verdict`) usando el
 * `legend` del envoltorio `DashboardResponse`. Si `legend` es `null`/ausente o no
 * trae la clave, cae al valor crudo como fallback.
 */
export function resolveLabel(
  legend: Record<string, string> | null | undefined,
  key: string
): string {
  return legend?.[key] ?? key;
}
