/**
 * Schema del resumen agregado de los expedientes de un lote, para el footer del
 * detalle de triaje (GET /api/v1/triage/batch/{batch_id}/summary).
 *
 * Forma confirmada en el backend: `GetBatchSummaryUseCase.execute` devuelve
 * `{ batch_id, total_cases, verdicts }`. Es el mismo resumen de triaje que el
 * listado de bandeja (`batchTriageSummarySchema`) más `batch_id`, así que se
 * REUTILIZA ese schema con `.extend` en vez de duplicar `total_cases`/`verdicts`.
 *
 * `verdicts` se mantiene como record ABIERTO (heredado del schema compartido):
 * aunque ESTE endpoint siempre inicializa todas las claves del enum
 * `TriageVerdict`, el schema lo comparte el listado, que puede emitir `{}`.
 */
import { z } from 'zod';
import { batchTriageSummarySchema } from './triage-summary-schema';

export const batchDetailSummarySchema = batchTriageSummarySchema.extend({
  batch_id: z.string(),
});
export type BatchDetailSummary = z.infer<typeof batchDetailSummarySchema>;
