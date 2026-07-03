/**
 * Esquemas de LECTURA de la entidad Actividad del dominio de intake
 * (document_intake_ocr, montado en `/api/v1/intake`). Es dominio compartido: la
 * lista (GET /activities/) la consumen tanto `carga-datos` (selección al cargar
 * un lote) como `triaje` (filtro de la tabla).
 *
 * La ESCRITURA (`CreateActivityRequest`, POST /activities/) NO vive aquí: solo
 * la usa `carga-datos`, así que su tipo se queda en ese feature y reutiliza el
 * `ActivityRequirement` que se exporta desde este archivo.
 *
 * Los requisitos referencian el catálogo de documentos solo por id
 * (`document_type_config_id`), por lo que estos schemas no dependen del
 * `documentTypeSchema` (que es específico de `carga-datos`).
 */
import { z } from 'zod';

/** Requisito de documento de una actividad (ActivityRequirementRequest/Response). */
export const activityRequirementSchema = z.object({
  document_type_config_id: z.string(),
  is_required: z.boolean(),
  confidence_threshold: z.number(),
});
export type ActivityRequirement = z.infer<typeof activityRequirementSchema>;

/** Actividad retornada por el backend (ActivityResponse). */
export const activitySchema = z.object({
  id: z.string(),
  program_id: z.string(),
  name: z.string(),
  requirements: z.array(activityRequirementSchema),
  is_active: z.boolean(),
});
export type Activity = z.infer<typeof activitySchema>;
