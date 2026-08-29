import { apiClient } from '@/lib/api-client';
import { parseApiResponse } from '@/lib/parse-api-response';
import { API_PATHS } from '@/lib/api-paths';
import {
  uploadMissingDocResultSchema,
  revalidateDossierResultSchema,
  type UploadMissingDocPayload,
  type UploadMissingDocResult,
  type RevalidateDossierResult,
} from '../schemas/dossier-schema';

/**
 * Servicio del expediente (dossier) en el contexto de intake: subir un documento
 * faltante y disparar la revalidación. Ambas rutas usan `API_PATHS.batches`
 * (`/api/v1/intake/api/v1/batches`, el doble `/api/v1` es intencional: el
 * `batch_router` se registró con prefijo absoluto dentro de `intake_app`). Se
 * resuelven contra el proxy (`/api/proxy`), que inyecta el Bearer.
 */
export const dossierService = {
  /**
   * POST /batches/{batchId}/dossiers/{caseDni}/documents — sube un documento
   * faltante del expediente (el `source_id` apunta al archivo en Drive).
   */
  async uploadMissingDoc(
    batchId: string,
    caseDni: string,
    payload: UploadMissingDocPayload
  ): Promise<UploadMissingDocResult> {
    const data = await apiClient.post(
      `${API_PATHS.batches}/${batchId}/dossiers/${caseDni}/documents`,
      payload
    );
    return parseApiResponse(uploadMissingDocResultSchema, data, 'la subida del documento');
  },

  /**
   * POST /batches/{batchId}/dossiers/{dniReference}/revalidate — dispara la
   * re-evaluación del expediente. Sin body. Idempotente: si no hay nada que
   * procesar devuelve `status: "NO_ACTION_NEEDED"`.
   */
  async revalidate(
    batchId: string,
    dniReference: string
  ): Promise<RevalidateDossierResult> {
    const data = await apiClient.post(
      `${API_PATHS.batches}/${batchId}/dossiers/${dniReference}/revalidate`
    );
    return parseApiResponse(
      revalidateDossierResultSchema,
      data,
      'la revalidación del expediente'
    );
  },
};
