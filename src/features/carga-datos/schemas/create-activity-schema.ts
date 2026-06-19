import { z } from 'zod';

/** Umbral de confianza por defecto para un documento recién seleccionado. */
export const DEFAULT_CONFIDENCE_THRESHOLD = 0.85;

/** Un documento del catálogo dentro del formulario, con su estado de selección. */
export const activityDocumentSchema = z.object({
  document_type_config_id: z.string(),
  name: z.string(),
  selected: z.boolean(),
  confidence_threshold: z
    .number({ error: 'Ingresa un umbral válido.' })
    .min(0, 'El umbral debe ser mayor o igual a 0.')
    .max(1, 'El umbral debe ser menor o igual a 1.'),
});

export const createActivitySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'El nombre debe tener al menos 3 caracteres.')
      .max(100, 'El nombre no puede superar los 100 caracteres.'),
    documents: z.array(activityDocumentSchema),
  })
  .refine((data) => data.documents.some((doc) => doc.selected), {
    message: 'Selecciona al menos un documento.',
    path: ['documents'],
  });

export type ActivityDocumentFormValue = z.infer<typeof activityDocumentSchema>;
export type CreateActivityFormValues = z.infer<typeof createActivitySchema>;
