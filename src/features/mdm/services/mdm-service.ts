import { apiClient } from '@/lib/api-client';
import { parseApiResponse } from '@/lib/parse-api-response';
import { API_PATHS } from '@/lib/api-paths';
import { activitySchema, type Activity } from '@/shared/schemas/activity-schema';

import {
  schoolSchema,
  schoolsListSchema,
  type School,
  type SchoolFormValues,
} from '../schemas/school-schema';
import type { CreateActivityPayload } from '../schemas/create-activity-schema';

/**
 * Servicio del feature `mdm` (Master Data Management).
 *
 * Colegios: `API_PATHS.schools` (`/api/v1/mdm/schools`, router del contexto
 * core_beneficiary_management montado bajo `/mdm`).
 * Creación de actividades: misma ruta que consume `carga-datos`
 * (`${API_PATHS.intake}/activities`), pero con el payload de plantillas propio
 * del MDM (incluye `activity_type` y fechas, alineado con ActivityCreateRequest).
 *
 * Las rutas se resuelven contra el proxy (`/api/proxy`), que inyecta el Bearer.
 * Cada respuesta se valida con Zod en la frontera del service.
 */
export const mdmService = {
  /** GET /api/v1/mdm/schools — listado completo de colegios (tabla MDM). */
  async getSchools(): Promise<School[]> {
    const data = await apiClient.get(API_PATHS.schools);
    return parseApiResponse(schoolsListSchema, data, 'los colegios');
  },

  /** POST /api/v1/mdm/schools — crea un colegio. Devuelve el colegio creado. */
  async createSchool(payload: SchoolFormValues): Promise<School> {
    const data = await apiClient.post(API_PATHS.schools, payload);
    return parseApiResponse(schoolSchema, data, 'el colegio creado');
  },

  /** PATCH /api/v1/mdm/schools/{id} — actualiza un colegio. */
  async updateSchool(id: string, payload: Partial<SchoolFormValues>): Promise<School> {
    const data = await apiClient.patch(`${API_PATHS.schools}/${id}`, payload);
    return parseApiResponse(schoolSchema, data, 'el colegio');
  },

  /** POST /activities/ — crea una actividad con plantilla de trámite y fechas. */
  async createActivity(payload: CreateActivityPayload): Promise<Activity> {
    const data = await apiClient.post(`${API_PATHS.intake}/activities`, payload);
    return parseApiResponse(activitySchema, data, 'la actividad creada');
  },
};