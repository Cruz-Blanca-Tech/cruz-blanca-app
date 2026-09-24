import { apiClient } from '@/lib/api-client';
import { parseApiResponse } from '@/lib/parse-api-response';
import { API_PATHS } from '@/lib/api-paths';
import { activitySchema, type Activity } from '@/shared/schemas/activity-schema';
import type { CreateActivityRequest } from '../types';

/**
 * Servicios exclusivos de `carga-datos` dentro del dominio de intake.
 * La LECTURA compartida (programas, lista de actividades y catálogo de
 * documentos) vive en `@/shared/services`; aquí queda solo la creación de
 * actividades, única operación de escritura de esta pantalla.
 *
 * Las rutas se resuelven contra el proxy (`/api/proxy`) que reenvía al backend.
 */
export const cargaDatosService = {
  /** POST /activities/ — crea una nueva actividad con sus requerimientos. */
  async createActivity(payload: CreateActivityRequest): Promise<Activity> {
    const data = await apiClient.post(`${API_PATHS.intake}/activities`, payload);
    return parseApiResponse(activitySchema, data, 'la actividad creada');
  },
};