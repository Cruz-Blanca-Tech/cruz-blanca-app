import type { TriageDiscrepancy } from '../schemas/triage-discrepancy-schema';

const MAX_LISTED = 3;
const MAX_LENGTH = 90;

function shorten(text: string): string {
  const clean = text.trim();
  return clean.length > MAX_LENGTH ? `${clean.slice(0, MAX_LENGTH - 1)}…` : clean;
}

/**
 * Mensaje tras guardar una corrección que NO dejó el expediente aprobado.
 * Si quedan observaciones de severidad ERROR (las que bloquean la aprobación) las
 * nombra, en vez de un genérico «Correcciones guardadas.» (D22).
 */
export function buildSavedMessage(
  discrepancies: Pick<TriageDiscrepancy, 'severity' | 'rule_description'>[]
): string {
  const blocking = discrepancies.filter((d) => d.severity.toUpperCase() === 'ERROR');
  if (blocking.length === 0) return 'Correcciones guardadas.';

  const listed = blocking.slice(0, MAX_LISTED).map((d) => `• ${shorten(d.rule_description)}`);
  const extra = blocking.length - listed.length;
  const header = `Correcciones guardadas. Quedan ${blocking.length} ${
    blocking.length === 1 ? 'observación' : 'observaciones'
  } por resolver:`;
  return [header, ...listed, ...(extra > 0 ? [`… y ${extra} más`] : [])].join('\n');
}
