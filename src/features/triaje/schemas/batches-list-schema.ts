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
// Resumen de triaje extraído a su propio archivo: lo comparten este listado y el
// detalle del lote. Se re-exporta para no romper a quien lo importa desde aquí.
import {
  batchTriageSummarySchema,
  type BatchTriageSummary,
} from './triage-summary-schema';

export { batchTriageSummarySchema };
export type { BatchTriageSummary };

const count = z.number().int().nonnegative();

/** Lote tal como lo devuelve el listado. */
export const batchListItemSchema = z.object({
  id: z.string(),
  activity_id: z.string(),
  status: batchStatusSchema,
  created_at: z.string().nullable(),
  documents_failed_count: count,
  documents_approved_count: count,
  documents_total_count: count.optional().default(0),
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
