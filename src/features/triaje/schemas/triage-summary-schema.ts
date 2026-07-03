/**
 * Resumen de triaje de un lote (total de expedientes + conteo por veredicto).
 *
 * Lo comparten DOS endpoints del backend, por eso vive aquí y no acoplado a uno:
 * - el listado de bandeja, embebido en cada lote (`triage_summary`,
 *   GET /api/v1/intake/api/v1/batches), y
 * - el detalle del lote (GET /api/v1/triage/batch/{id}/summary), que lo extiende
 *   con `batch_id` (ver `batch-detail-summary-schema.ts`).
 *
 * `verdicts` es un record ABIERTO string→número (claves = `TriageVerdict.name`)
 * y NO un enum cerrado: el listado lo emite como `{}` en su fallback
 * (`list_batches_use_case.py`: `triage_summaries.get(b.id, { ..., "verdicts": {} })`),
 * así que un record cerrado por enum rompería ese caso. La UI recorre solo las
 * claves conocidas y trata las ausentes como 0 (ver `triage-verdict-config.ts`).
 */
import { z } from 'zod';

const count = z.number().int().nonnegative();

export const batchTriageSummarySchema = z.object({
  total_cases: count,
  verdicts: z.record(z.string(), count),
});
export type BatchTriageSummary = z.infer<typeof batchTriageSummarySchema>;
