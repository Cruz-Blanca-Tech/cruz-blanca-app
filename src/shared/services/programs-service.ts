import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { parseApiResponse } from '@/lib/parse-api-response';
import { programSchema, type Program } from '@/shared/schemas/program-schema';
import { API_PATHS } from '@/lib/api-paths';

/**
 * Servicio de lectura de Programas (dominio de intake compartido).
 * Las rutas se resuelven contra el proxy (`/api/proxy`) que reenvía al backend.
 */
export const programsService = {
  /** GET /programs/ — lista de programas institucionales vigentes. */
  async getPrograms(): Promise<Program[]> {
    const data = await apiClient.get(`${API_PATHS.intake}/programs`);
    return parseApiResponse(z.array(programSchema), data, 'programas');
  },
};
