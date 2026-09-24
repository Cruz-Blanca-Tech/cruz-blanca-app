import { apiClient } from '@/lib/api-client';
import { parseApiResponse } from '@/lib/parse-api-response';
import { API_PATHS } from '@/lib/api-paths';
import {
  beneficiariesListSchema,
  type BeneficiariesList,
} from '../schemas/beneficiaries-list-schema';

/**
 * Servicio de LECTURA de beneficiarios (contexto MDM / Core Beneficiary
 * Management).
 *
 * El prefijo (`/api/v1/mdm/beneficiaries`) sale de `API_PATHS.beneficiaries`.
 * Las rutas se resuelven contra el proxy (`/api/proxy`), que inyecta el Bearer.
 *
 * El endpoint SOLO soporta paginación (`skip`/`limit`). No hay búsqueda ni
 * filtros server-side por programa, estado de perfil ni fechas: esos filtros del
 * mockup no existen en el backend (ver inventario del gap en la entrega).
 */

/** Paginación del listado de beneficiarios (mapea a los query params del backend). */
export interface BeneficiariesListFilters {
  skip?: number;
  limit?: number;
}

export const beneficiariosService = {
  /**
   * GET /beneficiaries/ — listado paginado de beneficiarios para la tabla.
   * Devuelve `PaginatedBeneficiaryResponse` (`items` + `total`/`skip`/`limit`).
   */
  async getBeneficiaries(
    filters?: BeneficiariesListFilters
  ): Promise<BeneficiariesList> {
    const params: Record<string, number> = {};
    if (filters?.skip != null) params.skip = filters.skip;
    if (filters?.limit != null) params.limit = filters.limit;

    const data = await apiClient.get(API_PATHS.beneficiaries, {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return parseApiResponse(
      beneficiariesListSchema,
      data,
      'el listado de beneficiarios'
    );
  },

  /**
   * POST /beneficiaries/ — crea manualmente un nuevo beneficiario sin OCR.
   */
  async createBeneficiary(payload: unknown): Promise<unknown> {
    const data = await apiClient.post(API_PATHS.beneficiaries, payload);
    return data;
  },

  /**
   * PATCH /beneficiaries/{id} — actualiza la información del beneficiario.
   */
  async updateBeneficiary(id: string, payload: unknown): Promise<unknown> {
    const data = await apiClient.patch(`${API_PATHS.beneficiaries}/${id}`, payload);
    return data;
  },

  /**
   * GET /beneficiaries/{id} — obtiene el perfil completo del beneficiario.
   */
  async getBeneficiary(id: string): Promise<unknown> {
    const data = await apiClient.get(`${API_PATHS.beneficiaries}/${id}`);
    return data;
  },

  /**
   * GET /beneficiaries/adults/search — busca adultos por DNI o nombre
   */
  async searchAdult(query: string): Promise<unknown> {
    const data = await apiClient.get(`${API_PATHS.beneficiaries}/adults/search`, {
      params: { query }
    });
    return data;
  },
};
