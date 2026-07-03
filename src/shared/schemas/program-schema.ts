/**
 * Esquema de la entidad Programa del dominio de intake (document_intake_ocr,
 * montado en `/api/v1/intake`). Es dominio compartido: lo consumen tanto
 * `carga-datos` (selección al crear un lote) como `triaje` (filtro de la tabla).
 *
 * El schema es la única fuente de verdad y a la vez la validación de runtime que
 * aplican los services en la frontera de la API; los tipos se derivan con
 * `z.infer`.
 */
import { z } from 'zod';

/** Programa institucional (GET /programs/ → ProgramResponse). */
export const programSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
});
export type Program = z.infer<typeof programSchema>;
