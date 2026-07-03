/**
 * Schemas de las acciones masivas sobre un lote en el contexto de Triaje:
 * verificar finalización (aprobar) y rechazar.
 *
 * Forma confirmada en el backend (data_quality_triage):
 * - verify-completion → `VerifyBatchCompletionUseCase.execute` (dict, sin
 *   `response_model`).
 * - reject → `reject_batch` en batch_router.py (dict literal).
 */
import { z } from 'zod';

const count = z.number().int().nonnegative();

/**
 * Estado de verificación del lote. Enum cerrado `BatchVerificationStatus(str)`
 * del backend (triage_status.py): serializa al valor literal del miembro.
 */
export const batchVerificationStatusSchema = z.enum([
  'COMPLETED',
  'PENDING',
  'NOT_FOUND',
]);
export type BatchVerificationStatus = z.infer<typeof batchVerificationStatusSchema>;

/**
 * Respuesta de POST /batch/{id}/verify-completion. `verdict_summary` es un
 * conteo por veredicto (claves = `TriageVerdict.name`): record ABIERTO
 * string→número, igual que el desglose del listado de lotes.
 */
export const batchVerifyCompletionSchema = z.object({
  status: batchVerificationStatusSchema,
  message: z.string(),
  verdict_summary: z.record(z.string(), count),
});
export type BatchVerifyCompletion = z.infer<typeof batchVerifyCompletionSchema>;

/**
 * Respuesta de POST /batch/{id}/reject. `rejected_count` es el nº de expedientes
 * pendientes que se rechazaron en masa (dict literal de `reject_batch`).
 */
export const batchRejectSchema = z.object({
  batch_id: z.string(),
  rejected_count: count,
  message: z.string(),
});
export type BatchReject = z.infer<typeof batchRejectSchema>;
