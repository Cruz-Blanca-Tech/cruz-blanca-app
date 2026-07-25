/**
 * Schema de los expedientes (casos de triaje) de un lote
 * (GET /api/v1/triage/batch/{batch_id}/cases).
 *
 * El backend tipa la respuesta con `PaginatedTriageResponse` →
 * `TriageCaseListItem` → `DiscrepancySchema` (data_quality_triage:
 * response_schemas.py / common_schemas.py), poblado en
 * `GetCasesByBatchUseCase`. Esta es la forma que valida este schema.
 *
 * Nota: la futura pantalla TriajeDetalleLote solo usará `dni_reference`,
 * `error_count`, `warning_count` y `discrepancies`, pero modelamos el response
 * completo que envía el backend (el schema es la frontera de validación).
 *
 * `status`/`verdict` llegan como strings planos (`.value` de los enums
 * `TriageStatus`/`TriageVerdict`); se tipan como `z.string()` para no romper
 * ante un valor nuevo del backend, igual que el record abierto de los lotes.
 */
import { z } from 'zod';
import { triageDiscrepancySchema } from './triage-discrepancy-schema';

const count = z.number().int().nonnegative();

// La discrepancia se extrajo a `triage-discrepancy-schema.ts` porque ahora la
// comparten varios responses (casos del lote y expediente EDUCA). Se reexporta
// para no romper los imports existentes que la traían desde este módulo.
export { triageDiscrepancySchema, type TriageDiscrepancy } from './triage-discrepancy-schema';

/** Expediente de triaje tal como lo devuelve la lista de casos del lote. */
export const triageCaseListItemSchema = z.object({
  id: z.string(),
  batch_id: z.string(),
  dni_reference: z.string(),
  status: z.string(),
  verdict: z.string(),
  min_confidence_score: z.number(),
  confidence_threshold: z.number(),
  error_count: count,
  warning_count: count,
  discrepancies: z.array(triageDiscrepancySchema),
  created_at: z.string(),
  updated_at: z.string().nullable(),
  /** Mapa código → uuid de los documentos ya cargados para este expediente. */
  document_ids: z.record(z.string(), z.string()).optional().default({}),
});
export type TriageCaseListItem = z.infer<typeof triageCaseListItemSchema>;

/**
 * Respuesta paginada. `total` es el conteo global de la query (sin `skip`/
 * `limit`), así que sirve para paginar: nº de páginas = ceil(total / limit).
 */
export const triageCasesSchema = z.object({
  items: z.array(triageCaseListItemSchema),
  total: count,
  skip: count,
  limit: count,
});
export type TriageCases = z.infer<typeof triageCasesSchema>;
