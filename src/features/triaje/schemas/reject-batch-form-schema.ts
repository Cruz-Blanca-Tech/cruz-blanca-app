/**
 * Schema del formulario de rechazo de un lote (diálogo "Cancelar lote"). El
 * backend exige `reason` obligatorio en POST /batch/{id}/reject; aquí se valida
 * en la frontera del formulario (React Hook Form + zodResolver), única fuente de
 * las reglas. El `reason` enviado al service es el valor ya validado y recortado.
 */
import { z } from 'zod';

export const rejectBatchFormSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, { error: 'Indica un motivo de al menos 10 caracteres.' })
    .max(500, { error: 'El motivo no puede superar los 500 caracteres.' }),
});

export type RejectBatchFormValues = z.infer<typeof rejectBatchFormSchema>;
