/**
 * Schema del resumen cuantitativo de lotes agrupados por estado
 * (GET /api/v1/intake/api/v1/batches/summary).
 *
 * El backend NO declara `response_model` en este endpoint, pero el use case
 * inicializa SIEMPRE las 6 claves del enum `BatchStatus` a 0 antes de sumar
 * (ver get_batches_summary_use_case.py), así que todas vienen garantizadas.
 *
 * El schema es la única fuente de verdad y la validación de runtime en la
 * frontera del service; los tipos se derivan con `z.infer`.
 */
import { z } from 'zod';
import { batchStatusSchema } from './batch-status-schema';

const count = z.number().int().nonnegative();

export const batchesSummarySchema = z.object({
  total_batches: count,
  statuses: z.record(batchStatusSchema, count),
});

export type BatchesSummary = z.infer<typeof batchesSummarySchema>;
