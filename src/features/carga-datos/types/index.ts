/**
 * Tipos propios del feature de carga de datos (OCR), alineados con el backend
 * (contexto document_intake_ocr, montado en `/api/v1/intake`).
 *
 * Aquí viven SOLO tipos puros (compile-time): las requests de ESCRITURA (crear
 * actividad / crear lote) y los tipos de vista derivados para la UI del wizard.
 * Son interfaces escritas a mano porque no derivan de ningún schema Zod.
 *
 * Los schemas Zod del feature (validación de runtime en la frontera de la API y
 * de los formularios) viven en `../schemas`: el catálogo de documentos en
 * `document-catalog-schema` y el batch en `create-batch-schema`. El dominio de
 * LECTURA compartido con otros features vive en `@/shared/schemas`.
 */

import type { ActivityRequirement } from '@/shared/schemas/activity-schema';
import type { PickedFile } from '@/shared/drive/types';

// `PickedFile` se movió a `@/shared/drive` (lo consumen `carga-datos` y `triaje`).
// Se re-exporta desde aquí para no romper los importadores internos del feature.
export type { PickedFile };

/**
 * Body para crear una actividad (POST /activities/ → ActivityCreateRequest).
 * Es escritura exclusiva de `carga-datos`; reutiliza `ActivityRequirement` del
 * dominio compartido.
 */
export interface CreateActivityRequest {
  name: string;
  is_active: boolean;
  program_id: string;
  requirements: ActivityRequirement[];
}

/** Body para crear un batch de extracción (POST /api/v1/batches/). */
export interface CreateBatchRequest {
  activity_id: string;
  files: PickedFile[];
  description: string;
}

/**
 * Resumen de lo enviado en el Paso 1, armado en el frontend (fuente de verdad
 * de lo que el usuario cargó). El conteo de archivos NO se pide al backend: el
 * Paso 1 ya sabe cuántos envió (`filesCount === files.length`).
 */
export interface BatchSummary {
  programLabel: string;
  activityLabel: string;
  filesCount: number;
  submittedAt: Date;
}

/**
 * Documento esperado de una actividad, ya resuelto para la UI: combina el
 * requisito de la actividad (umbral) con su tipo de documento del catálogo
 * (nombre, código/sufijo, imagen de ejemplo). Es una vista derivada, no un
 * tipo del backend.
 */
export interface ExpectedDocument {
  id: string;
  name: string;
  /** Código del tipo de documento; se usa como sufijo en el nombre de archivo. */
  code: string;
  year: number;
  previewImageUrl: string | null;
  confidenceThreshold: number;
}
