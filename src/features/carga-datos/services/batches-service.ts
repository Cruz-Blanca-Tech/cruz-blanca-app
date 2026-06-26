import { apiClient } from '@/lib/api-client';
import type { CreateBatchRequest, CreateBatchResponse } from '../types';

/**
 * Servicio de batches de extracción.
 *
 * El router de batches vive DENTRO de la sub-app `intake_app` (montada en
 * `/api/v1/intake`), pero se registró con un prefijo absoluto `/api/v1/batches`.
 * Por eso la URL servible real es la composición de ambos:
 * `/api/v1/intake` + `/api/v1/batches` → `/api/v1/intake/api/v1/batches/`.
 * (El path `/api/v1/batches/` que aparece en el OpenAPI de intake es relativo a
 * ese montaje, no la ruta final.)
 *
 * Igual que en `activities-service`, omitimos el slash final y dejamos que el
 * `redirect_slashes` de FastAPI lo resuelva (307 → ruta con slash). Las rutas se
 * resuelven contra el proxy (`/api/proxy`), que inyecta el Bearer automáticamente.
 */
const INTAKE_BASE = '/api/v1/intake';
const BATCHES_BASE = `${INTAKE_BASE}/api/v1/batches`;

export const batchesService = {
  /** POST → crea un batch a partir de archivos seleccionados en Drive. */
  createBatch(payload: CreateBatchRequest): Promise<CreateBatchResponse> {
    return apiClient.post<CreateBatchResponse>(BATCHES_BASE, payload);
  },
};
