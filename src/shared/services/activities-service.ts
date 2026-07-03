import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { parseApiResponse } from '@/lib/parse-api-response';
import { activitySchema, type Activity } from '@/shared/schemas/activity-schema';
import { API_PATHS } from '@/lib/api-paths';

/**
 * Servicio de lectura de Actividades (dominio de intake compartido).
 * La creación de actividades (POST /activities/) es exclusiva de `carga-datos`
 * y vive en ese feature; aquí solo está la lectura que ambos features comparten.
 */
export const activitiesService = {
  /** GET /activities/?program_id= — actividades, opcionalmente filtradas por programa. */
  async getActivities(programId?: string | null): Promise<Activity[]> {
    const data = await apiClient.get(`${API_PATHS.intake}/activities`, {
      params: programId ? { program_id: programId } : undefined,
    });
    return parseApiResponse(z.array(activitySchema), data, 'actividades');
  },
};
