import { z } from 'zod';
import { activityRequirementSchema } from '@/shared/schemas/activity-schema';

/**
 * Formulario de creación de actividad en MDM: programa + plantilla de trámite
 * + nombre del período + fechas opcionales. La plantilla determina los códigos
 * de documento exigidos, que se resuelven contra el catálogo en el submit.
 */
export const createActivityFormSchema = z.object({
  name: z.string().trim().min(1, 'Ingresa el nombre del período/evento.'),
  program_id: z.string().min(1, 'Selecciona un programa.'),
  activity_type: z.string().min(1, 'Selecciona la plantilla de trámite.'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});
export type CreateActivityFormValues = z.infer<typeof createActivityFormSchema>;

/**
 * Payload de POST /activities/ (alineado con ActivityCreateRequest del backend).
 * Se arma en el submit a partir del formulario y de la plantilla seleccionada
 * (códigos de documento → ids del catálogo). Es un tipo interno del feature;
 * los requerimientos reutilizan el schema compartido `activityRequirementSchema`.
 */
export const createActivityPayloadSchema = z.object({
  name: z.string(),
  program_id: z.string(),
  activity_type: z.string(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  requirements: z.array(activityRequirementSchema),
});
export type CreateActivityPayload = z.infer<typeof createActivityPayloadSchema>;