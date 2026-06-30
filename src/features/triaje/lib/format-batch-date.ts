/**
 * Formateo de la fecha de carga de un lote (`created_at`, ISO o `null`).
 * Devuelve la fecha absoluta ("07 may 2026, 14:48") y una etiqueta relativa
 * ("hace 3 min"), como en el mockup. Se usa solo en client components, así que
 * `Date.now()` no provoca desajustes de hidratación.
 */

const absoluteFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export interface FormattedBatchDate {
  absolute: string;
  relative: string;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 0) return 'hace instantes';
  if (diff < MINUTE) return 'hace instantes';
  if (diff < HOUR) {
    const mins = Math.floor(diff / MINUTE);
    return `hace ${mins} min`;
  }
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `hace ${hours} h`;
  }
  const days = Math.floor(diff / DAY);
  if (days === 1) return 'ayer';
  return `hace ${days} d`;
}

export function formatBatchDate(createdAt: string | null): FormattedBatchDate {
  if (!createdAt) return { absolute: 'Sin fecha', relative: '' };
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return { absolute: 'Sin fecha', relative: '' };
  return {
    absolute: absoluteFormatter.format(date),
    relative: formatRelative(date),
  };
}
