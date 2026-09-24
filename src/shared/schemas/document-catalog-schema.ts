import { z } from 'zod';
import { toDriveThumbnailUrl } from '@/lib/drive-image';

/**
 * Tipo de documento del catálogo (GET /document-catalog/ → DocumentTypeConfigResponse).
 * Su `id` es el `document_type_config_id` que se envía al crear una actividad.
 *
 * Antes vivía en `carga-datos`; se promovió a compartido porque ahora también lo
 * consume el feature `mdm` (plantillas de trámite que mapean códigos de documento
 * a ids del catálogo para crear actividades).
 */
export const documentTypeSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  year: z.number(),
  model_id: z.string(),
  version: z.number(),
  preview_image_url: z
    .string()
    .nullable()
    .transform((url) => toDriveThumbnailUrl(url)),
  is_active: z.boolean(),
});
export type DocumentType = z.infer<typeof documentTypeSchema>;