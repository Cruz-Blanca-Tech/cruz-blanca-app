import { z } from 'zod';
import type { PickedFile } from '../types';

/**
 * Schemas Zod de la creación de un batch de extracción: la validación del
 * formulario (entrada de la UI) y la respuesta del backend (frontera de la API).
 */

/**
 * Validación del formulario de "Nueva Digitalización" (OCR Paso 1).
 *
 * Su estado vive repartido entre el store (programa/actividad), el picker de
 * Google Drive (archivos) y un textarea (descripción). En vez de validar cada
 * pieza con `if`/`toast` dispersos, se centraliza aquí en un único schema: de él
 * se derivan tanto el guard del botón como el aviso de campos faltantes.
 *
 * El output coincide con `CreateBatchRequest`, por lo que `safeParse().data` se
 * envía directo al backend (la descripción ya viene `trim()`-eada).
 */
export const createBatchFormSchema = z.object({
  activity_id: z.string().min(1, 'Selecciona una actividad.'),
  files: z
    .array(z.custom<PickedFile>())
    .min(1, 'Selecciona al menos un archivo de Google Drive.'),
  description: z.string().trim().min(1, 'Escribe una descripción del lote.'),
});

export type CreateBatchFormValues = z.infer<typeof createBatchFormSchema>;

/** Archivo que el backend no pudo procesar dentro de un batch. */
const batchFailedFileSchema = z.object({
  file_name: z.string(),
  reason: z.string(),
});

/** Respuesta de POST /api/v1/batches/. */
export const createBatchResponseSchema = z.object({
  batch_id: z.string(),
  batch_status: z.string(),
  description: z.string(),
  total_dossiers: z.number(),
  total_failed_files: z.number(),
  failed_files: z.array(batchFailedFileSchema),
  message: z.string(),
});
export type CreateBatchResponse = z.infer<typeof createBatchResponseSchema>;
