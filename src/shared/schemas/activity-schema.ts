/**
 * Esquemas de LECTURA de la entidad Actividad del dominio de intake
 * (document_intake_ocr, montado en `/api/v1/intake`). Es dominio compartido: la
 * lista (GET /activities/) la consumen `carga-datos` (selección al cargar un
 * lote), `triaje` (filtro de la tabla) y `mdm` (listado de períodos/campañas).
 *
 * El schema es la única fuente de verdad y a la vez la validación de runtime que
 * aplican los services en la frontera de la API; los tipos se derivan con
 * `z.infer`. Incluye los campos que devuelve `ActivityResponse` del backend
 * (`activity_type`, `start_date`, `end_date`): sin ellos Zod los descartaba
 * silenciosamente del lado del cliente.
 *
 * La ESCRITURA (`POST /activities/`) la consume más de un feature con formas de
 * payload distintas (formulario con selección de documentos en `carga-datos`,
 * plantillas de trámite en `mdm`), así que su schema vive en cada feature y
 * reutiliza el `ActivityRequirement` que se exporta desde este archivo.
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
  /** Tipo de trámite/plantilla (p. ej. "EDUCA_INSCRIPTION"). */
  activity_type: z.string(),
  /** Fechas como ISO "YYYY-MM-DD" (date de Pydantic) o null si nunca se fijaron. */
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  requirements: z.array(activityRequirementSchema),
  is_active: z.boolean(),
});
export type Activity = z.infer<typeof activitySchema>;