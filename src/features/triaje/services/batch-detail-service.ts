import { apiClient } from '@/lib/api-client';
import { parseApiResponse } from '@/lib/parse-api-response';
import { API_PATHS } from '@/lib/api-paths';
import { triageCasesSchema, type TriageCases } from '../schemas/triage-cases-schema';
import {
  batchVerifyCompletionSchema,
  type BatchVerifyCompletion,
  batchRejectSchema,
  type BatchReject,
} from '../schemas/batch-actions-schema';
import {
  batchDetailSummarySchema,
  type BatchDetailSummary,
} from '../schemas/batch-detail-summary-schema';

/**
 * Servicio del DETALLE de un lote (contexto de Triaje): casos del lote y, más
 * adelante, las mutaciones de aprobación/rechazo masivos. Es un prefijo distinto
 * al de las lecturas de bandeja (`API_PATHS.batches`): aquí va `API_PATHS.batch`
 * (`/api/v1/triage/batch`, singular). Las rutas se resuelven contra el proxy
 * (`/api/proxy`), que inyecta el Bearer.
 */

/** Paginación de la lista de casos del lote (mapea a query params del backend). */
export interface BatchCasesFilters {
  skip?: number;
  limit?: number;
}

export const batchDetailService = {
  /**
   * GET /batch/{batchId}/cases — expedientes de triaje del lote, paginados
   * (`skip`/`limit`).
   */
  async getBatchCases(
    batchId: string,
    filters?: BatchCasesFilters
  ): Promise<TriageCases> {
    const params: Record<string, number> = {};
    if (filters?.skip != null) params.skip = filters.skip;
    if (filters?.limit != null) params.limit = filters.limit;

    const data = await apiClient.get(`${API_PATHS.batch}/${batchId}/cases`, {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return parseApiResponse(triageCasesSchema, data, 'los expedientes del lote');
  },

  /**
   * GET /batch/{batchId}/summary — resumen agregado de los expedientes del lote
   * (total y conteo por veredicto), para el footer del detalle. Sin body.
   */
  async getBatchSummary(batchId: string): Promise<BatchDetailSummary> {
    const data = await apiClient.get(`${API_PATHS.batch}/${batchId}/summary`);
    return parseApiResponse(
      batchDetailSummarySchema,
      data,
      'el resumen del lote'
    );
  },

  /**
   * POST /batch/{batchId}/verify-completion — verifica si todos los expedientes
   * del lote están resueltos y, de estarlo, lo marca como completado (aprueba el
   * lote). Sin body: solo el `batchId`.
   */
  async verifyBatchCompletion(batchId: string): Promise<BatchVerifyCompletion> {
    const data = await apiClient.post(`${API_PATHS.batch}/${batchId}/verify-completion`);
    return parseApiResponse(
      batchVerifyCompletionSchema,
      data,
      'la verificación del lote'
    );
  },

  /**
   * POST /batch/{batchId}/reject — rechaza en masa los expedientes pendientes
   * del lote. El backend exige `reason` (obligatorio) en el body.
   */
  async rejectBatch(batchId: string, reason: string): Promise<BatchReject> {
    const data = await apiClient.post(`${API_PATHS.batch}/${batchId}/reject`, {
      reason,
    });
    return parseApiResponse(batchRejectSchema, data, 'el rechazo del lote');
  },
};
