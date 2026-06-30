import { apiClient } from '@/lib/api-client';
import { parseApiResponse } from '@/lib/parse-api-response';
import { API_PATHS } from '@/lib/api-paths';
import {
  batchesSummarySchema,
  type BatchesSummary,
} from '../schemas/batches-summary-schema';
import {
  batchStatusesSchema,
  type BatchStatuses,
} from '../schemas/batch-status-schema';
import {
  batchesListSchema,
  type BatchesList,
} from '../schemas/batches-list-schema';

/**
 * Servicio de LECTURA de batches (exclusivo de `triaje`: summary, statuses,
 * listado). La creación de batches vive en `carga-datos`.
 *
 * El prefijo (`/api/v1/intake/api/v1/batches`) sale de `API_PATHS.batches`.
 * Las rutas se resuelven contra el proxy (`/api/proxy`), que inyecta el Bearer.
 */

/** Filtros opcionales del resumen de lotes (mapean a query params del backend). */
export interface BatchesSummaryFilters {
  programId?: string | null;
  activityId?: string | null;
  status?: string | null;
}

/** Filtros + paginación del listado de lotes (mapean a query params del backend). */
export interface BatchesListFilters extends BatchesSummaryFilters {
  skip?: number;
  limit?: number;
}

export const triajeBatchesService = {
  /**
   * GET /batches/summary — totales por estado (para las cards del triaje),
   * con filtros opcionales por programa y/o actividad.
   */
  async getBatchesSummary(filters?: BatchesSummaryFilters): Promise<BatchesSummary> {
    const params: Record<string, string> = {};
    if (filters?.programId) params.program_id = filters.programId;
    if (filters?.activityId) params.activity_id = filters.activityId;
    if (filters?.status) params.status = filters.status;

    const data = await apiClient.get(`${API_PATHS.batches}/summary`, {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return parseApiResponse(batchesSummarySchema, data, 'el resumen de lotes');
  },

  /**
   * GET /batches/statuses — estados de lote disponibles (para el select del
   * filtro). Devuelve los valores del enum `BatchStatus` del backend.
   */
  async getBatchStatuses(): Promise<BatchStatuses> {
    const data = await apiClient.get(`${API_PATHS.batches}/statuses`);
    return parseApiResponse(batchStatusesSchema, data, 'los estados de lotes');
  },

  /**
   * GET /batches/ — listado de lotes para la tabla, con filtros opcionales por
   * programa, actividad y estado, más paginación (`skip`/`limit`).
   */
  async getBatches(filters?: BatchesListFilters): Promise<BatchesList> {
    const params: Record<string, string | number> = {};
    if (filters?.skip != null) params.skip = filters.skip;
    if (filters?.limit != null) params.limit = filters.limit;
    if (filters?.programId) params.program_id = filters.programId;
    if (filters?.activityId) params.activity_id = filters.activityId;
    if (filters?.status) params.status = filters.status;

    const data = await apiClient.get(API_PATHS.batches, {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return parseApiResponse(batchesListSchema, data, 'el listado de lotes');
  },
};
