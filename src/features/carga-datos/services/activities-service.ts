import { apiClient } from '@/lib/api-client';
import type {
  Activity,
  CreateActivityRequest,
  DocumentType,
  Program,
} from '../types';

/**
 * Prefijo del contexto Document Intake & OCR.
 * En el backend `intake_app` se monta en `{API_V1_STR}/intake` (ver src/main.py).
 *
 * Nota sobre el slash final: las rutas del backend usan slash final
 * (`/programs/`, etc.), pero Next reescribe el slash final de las route
 * handlers por defecto. Lo omitimos aquí —igual que en auth-service— y dejamos
 * que el `redirect_slashes` de FastAPI lo resuelva del lado del servidor.
 */
const INTAKE_BASE = '/api/v1/intake';

/**
 * Servicios del feature de carga de datos.
 * Las rutas se resuelven contra el proxy (`/api/proxy`) que reenvía al backend.
 */
export const cargaDatosService = {
  /** GET /programs/ — lista de programas institucionales vigentes. */
  getPrograms(): Promise<Program[]> {
    return apiClient.get<Program[]>(`${INTAKE_BASE}/programs`);
  },

  /** GET /document-catalog/ — catálogo de tipos de documento. */
  getDocumentCatalog(): Promise<DocumentType[]> {
    return apiClient.get<DocumentType[]>(`${INTAKE_BASE}/document-catalog`);
  },

  /** GET /activities/?program_id= — actividades, opcionalmente filtradas por programa. */
  getActivities(programId?: string | null): Promise<Activity[]> {
    return apiClient.get<Activity[]>(`${INTAKE_BASE}/activities`, {
      params: programId ? { program_id: programId } : undefined,
    });
  },

  /** POST /activities/ — crea una nueva actividad con sus requerimientos. */
  createActivity(payload: CreateActivityRequest): Promise<Activity> {
    return apiClient.post<Activity>(`${INTAKE_BASE}/activities`, payload);
  },
};
