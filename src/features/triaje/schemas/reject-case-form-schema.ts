/**
 * Schema del formulario de rechazo de un expediente EDUCA (diálogo "Rechazar
 * expediente" de la corrección). El backend exige `reason` obligatorio en
 * POST /educa/{caseId}/reject; se valida en la frontera del formulario (React
 * Hook Form + zodResolver), única fuente de las reglas.
 */
import { z } from 'zod';

export const rejectCaseFormSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, { error: 'Indica un motivo de al menos 10 caracteres.' })
    .max(500, { error: 'El motivo no puede superar los 500 caracteres.' }),
});

export type RejectCaseFormValues = z.infer<typeof rejectCaseFormSchema>;
