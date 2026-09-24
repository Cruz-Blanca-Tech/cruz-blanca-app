import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { parseApiResponse } from '@/lib/parse-api-response';
import { API_PATHS } from '@/lib/api-paths';
import { documentTypeSchema, type DocumentType } from '@/shared/schemas/document-catalog-schema';

/**
 * Servicio del catálogo de tipos de documento (dominio de intake compartido).
 * Lo consumen `carga-datos` (creación de actividades con selección de
 * documentos) y `mdm` (plantillas de trámite por códigos de documento).
 *
 * Las rutas se resuelven contra el proxy (`/api/proxy`) que reenvía al backend.
 */
export const documentCatalogService = {
  /** GET /document-catalog/ — catálogo de tipos de documento. */
  async getDocumentCatalog(): Promise<DocumentType[]> {
    const data = await apiClient.get(`${API_PATHS.intake}/document-catalog`);
    return parseApiResponse(
      z.array(documentTypeSchema),
      data,
      'el catálogo de documentos'
    );
  },
};