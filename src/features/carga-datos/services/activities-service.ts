import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { parseApiResponse } from '@/lib/parse-api-response';
import { API_PATHS } from '@/lib/api-paths';
import { activitySchema, type Activity } from '@/shared/schemas/activity-schema';
import {
  documentTypeSchema,
  type DocumentType,
} from '../schemas/document-catalog-schema';
import type { CreateActivityRequest } from '../types';

/**
 * Servicios exclusivos de `carga-datos` dentro del dominio de intake.
 * La LECTURA compartida (programas y lista de actividades) vive en
 * `@/shared/services`; aquí quedan solo las operaciones que únicamente usa esta
 * pantalla: el catálogo de documentos y la creación de actividades.
 *
 * Las rutas se resuelven contra el proxy (`/api/proxy`) que reenvía al backend.
 */
export const cargaDatosService = {
  /** GET /document-catalog/ — catálogo de tipos de documento. */
  async getDocumentCatalog(): Promise<DocumentType[]> {
    const data = await apiClient.get(`${API_PATHS.intake}/document-catalog`);
    return parseApiResponse(
      z.array(documentTypeSchema),
      data,
      'el catálogo de documentos'
    );
  },

  /** POST /activities/ — crea una nueva actividad con sus requerimientos. */
  async createActivity(payload: CreateActivityRequest): Promise<Activity> {
    const data = await apiClient.post(`${API_PATHS.intake}/activities`, payload);
    return parseApiResponse(activitySchema, data, 'la actividad creada');
  },
};
