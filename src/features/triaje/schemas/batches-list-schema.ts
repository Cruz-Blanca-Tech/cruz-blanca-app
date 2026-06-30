/**
 * Schema del listado de lotes para la tabla de triaje
 * (GET /api/v1/intake/api/v1/batches/).
 *
 * El backend tipa la respuesta con `ListBatchesResponse` (batch_schema.py:
 * `ListBatchesResponse`/`BatchItemSchema`/`TriageSummarySchema`), que es la
 * forma que valida este schema.
 *
 * El schema es la única fuente de verdad y la validación de runtime en la
 * frontera del service; los tipos se derivan con `z.infer`.
 */
import { z } from 'zod';
import { batchStatusSchema } from './batch-status-schema';

const count = z.number().int().nonnegative();

/** Resumen de triaje embebido en cada lote. */
export const batchTriageSummarySchema = z.object({
  total_cases: count,
  // Conteo por veredicto de triaje (claves = `TriageVerdict.name`). Las claves
  // varían y en el fallback del backend puede venir `{}`, por eso es un record
  // ABIERTO string→número y NO un enum exhaustivo (un enum fallaría con `{}`).
  verdicts: z.record(z.string(), count),
});
export type BatchTriageSummary = z.infer<typeof batchTriageSummarySchema>;

/** Lote tal como lo devuelve el listado. */
export const batchListItemSchema = z.object({
  id: z.string(),
  activity_id: z.string(),
  status: batchStatusSchema,
  created_at: z.string().nullable(),
  documents_failed_count: count,
  documents_approved_count: count,
  description: z.string().nullable(),
  activity_name: z.string().nullable(),
  program_name: z.string().nullable(),
  triage_summary: batchTriageSummarySchema,
});
export type BatchListItem = z.infer<typeof batchListItemSchema>;

/**
 * Respuesta completa del listado. `total` es el conteo GLOBAL de la query
 * filtrada (el backend lo calcula con un `count()` aparte sobre la misma
 * condición, antes de aplicar `skip`/`limit`), así que sirve para paginar de
 * verdad: nº de páginas = ceil(total / limit).
 */
export const batchesListSchema = z.object({
  total: count,
  batches: z.array(batchListItemSchema),
});
export type BatchesList = z.infer<typeof batchesListSchema>;
