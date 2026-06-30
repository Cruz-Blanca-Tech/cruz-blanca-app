import { apiClient } from '@/lib/api-client';
import { parseApiResponse } from '@/lib/parse-api-response';
import { API_PATHS } from '@/lib/api-paths';
import {
  createBatchResponseSchema,
  type CreateBatchResponse,
} from '../schemas/create-batch-schema';
import type { CreateBatchRequest } from '../types';

/**
 * Servicio de batches de extracción (creación — exclusivo de `carga-datos`).
 * La LECTURA de batches (summary, statuses, listado) la usará solo `triaje`, así
 * que vivirá en ese feature, no aquí.
 *
 * La ruta servible (`/api/v1/intake/api/v1/batches`, con doble `/api/v1`) está
 * centralizada en `API_PATHS.batches`. Se omite el slash final y lo repone el
 * `redirect_slashes` de FastAPI (307). Todo se resuelve contra el proxy
 * (`/api/proxy`), que inyecta el Bearer.
 */
export const batchesService = {
  /** POST → crea un batch a partir de archivos seleccionados en Drive. */
  async createBatch(payload: CreateBatchRequest): Promise<CreateBatchResponse> {
    const data = await apiClient.post(API_PATHS.batches, payload);
    return parseApiResponse(createBatchResponseSchema, data, 'la creación del lote');
  },
};
