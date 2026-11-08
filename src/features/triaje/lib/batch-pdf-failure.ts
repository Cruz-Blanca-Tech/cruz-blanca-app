/** Prefijo con el que el backend deja en `failure_reason` el fallo del PDF consolidado (D30). */
export const PDF_FAILURE_PREFIX = 'PDF consolidado no generado';

/**
 * Devuelve el detalle del fallo del PDF consolidado, o null si el lote no lo tiene.
 * El backend lo guarda como «PDF consolidado no generado: <detalle>».
 */
export function getPdfFailureDetail(failureReason: string | null | undefined): string | null {
  if (!failureReason || !failureReason.startsWith(PDF_FAILURE_PREFIX)) return null;
  const detail = failureReason.slice(PDF_FAILURE_PREFIX.length).replace(/^:\s*/, '').trim();
  return detail || 'Intente generarlo de nuevo.';
}
