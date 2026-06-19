/**
 * Tipos del feature de carga de datos (OCR), alineados con el backend
 * (contexto document_intake_ocr, montado en `/api/v1/intake`).
 * Endpoints: GET /programs/, GET /document-catalog/, GET/POST /activities/
 */

/** Programa institucional (GET /programs/ → ProgramResponse). */
export interface Program {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

/**
 * Tipo de documento del catálogo (GET /document-catalog/ → DocumentTypeConfigResponse).
 * Su `id` es el `document_type_config_id` que se envía al crear una actividad.
 */
export interface DocumentType {
  id: string;
  code: string;
  name: string;
  year: number;
  model_id: string;
  version: number;
  preview_image_url: string | null;
  is_active: boolean;
}

/** Requisito de documento enviado al crear una actividad (ActivityRequirementRequest). */
export interface ActivityRequirement {
  document_type_config_id: string;
  is_required: boolean;
  confidence_threshold: number;
}

/** Body para crear una actividad (POST /activities/ → ActivityCreateRequest). */
export interface CreateActivityRequest {
  name: string;
  is_active: boolean;
  program_id: string;
  requirements: ActivityRequirement[];
}

/** Actividad retornada por el backend (ActivityResponse). */
export interface Activity {
  id: string;
  program_id: string;
  name: string;
  requirements: ActivityRequirement[];
  is_active: boolean;
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
