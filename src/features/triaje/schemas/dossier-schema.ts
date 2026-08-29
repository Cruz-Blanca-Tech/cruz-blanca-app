/**
 * Schemas del expediente (dossier) en el contexto de intake: subida de un
 * documento faltante y revalidación del expediente. Ambos endpoints cuelgan de
 * `.../batches/{batch_id}/dossiers/{dni_reference}/...` (prefijo doble `/api/v1`
 * de `API_PATHS.batches`).
 *
 * Los tipos se derivan con `z.infer`: son la única fuente de verdad de la forma
 * de estas request/response (no se declaran `interface` a mano).
 */
import { z } from 'zod';

/**
 * Body del POST `.../documents`. Se construye desde un `PickedFile` elegido en
 * Drive, así que cruza la frontera hacia el backend y se valida.
 */
export const uploadMissingDocPayloadSchema = z.object({
  document_code: z.string(),
  file: z.object({
    file_name: z.string(),
    source_id: z.string(),
  }),
});
export type UploadMissingDocPayload = z.infer<typeof uploadMissingDocPayloadSchema>;

/** Respuesta del POST `.../documents`. */
export const uploadMissingDocResultSchema = z.object({
  message: z.string(),
  document_id: z.string(),
});
export type UploadMissingDocResult = z.infer<typeof uploadMissingDocResultSchema>;

/**
 * Respuesta del POST `.../revalidate`. Idempotente: si ya no hay nada que
 * procesar el backend devuelve `status: "NO_ACTION_NEEDED"`. El resto de campos
 * son informativos y pueden faltar.
 */
export const revalidateDossierResultSchema = z.object({
  status: z.enum(['REVALIDATING', 'NO_ACTION_NEEDED']),
  batch_id: z.string().nullish(),
  dni_reference: z.string().nullish(),
  message: z.string().nullish(),
  detail: z.unknown().nullish(),
});
export type RevalidateDossierResult = z.infer<typeof revalidateDossierResultSchema>;
