import { z } from 'zod';

/**
 * Colegio del maestro MDM (GET /api/v1/mdm/schools → SchoolResponse).
 * Lo consumen la pantalla `mdm/colegios` (tabla) y el `SchoolSelect`
 * (formularios de beneficiario), por eso el schema vive en el feature.
 */
export const schoolSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string().nullable(),
  phone: z.string().nullable(),
  is_active: z.boolean(),
});

export const schoolsListSchema = z.array(schoolSchema);

/**
 * Datos del formulario de alta/edición de colegio (SchoolCreate / SchoolUpdate).
 * `location` y `phone` son opcionales; se envían tal cual (string o vacío).
 */
export const schoolFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.'),
  location: z.string().optional(),
  phone: z.string().optional(),
});

export type School = z.infer<typeof schoolSchema>;
export type SchoolsList = z.infer<typeof schoolsListSchema>;
export type SchoolFormValues = z.infer<typeof schoolFormSchema>;