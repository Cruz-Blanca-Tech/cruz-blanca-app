import { apiClient } from '@/lib/api-client';
import { parseApiResponse } from '@/lib/parse-api-response';
import { API_PATHS } from '@/lib/api-paths';
import {
  createBatchResponseSchema,
  type CreateBatchResponse,
} from '../schemas/create-batch-schema';
import type { CreateBatchRequest, PickedFile } from '../types';

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

  /** POST → anexa documentos a un expediente específico de un lote existente. */
  async appendDocuments(
    batchId: string,
    dniReference: string,
    files: PickedFile[]
  ): Promise<{
    batch_id: string;
    dni_reference: string;
    dossier_status: string;
    added_documents_count: number;
    rejected_documents_count: number;
    message: string;
  }> {
    const url = `${API_PATHS.batches}/${batchId}/dossiers/${dniReference}/documents`;
    const data = await apiClient.post(url, { files });
    return data as {
      batch_id: string;
      dni_reference: string;
      dossier_status: string;
      added_documents_count: number;
      rejected_documents_count: number;
      message: string;
    };
  },
};
