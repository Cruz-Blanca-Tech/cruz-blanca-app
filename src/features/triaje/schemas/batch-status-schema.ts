/**
 * Estados posibles de un lote de extracción. Fuente de verdad: el enum
 * `BatchStatus` del backend (document_intake_ocr/.../extraction_batch.py).
 *
 * Es el origen ÚNICO de los valores de estado en el frontend de triaje: lo
 * consume el listado de estados (GET /batches/statuses → string[]) y también el
 * conteo por estado del summary (como claves del record).
 */
import { z } from 'zod';

export const batchStatusValues = [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'REJECTED',
  'FINALIZED',
] as const;

export const batchStatusSchema = z.enum(batchStatusValues);
export type BatchStatus = z.infer<typeof batchStatusSchema>;

/** Lista de estados disponibles (GET /batches/statuses → string[]). */
export const batchStatusesSchema = z.array(batchStatusSchema);
export type BatchStatuses = z.infer<typeof batchStatusesSchema>;
