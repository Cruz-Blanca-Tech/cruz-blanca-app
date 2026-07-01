/**
 * Documentos (imágenes) de un expediente, para el visor de la pantalla
 * TriajeCorreccion
 * (GET /api/v1/intake/api/v1/batches/{batch_id}/dossiers/{dni_reference}/documents).
 *
 * El backend tipa la respuesta con `GetDocumentsByDossierResponse`
 * (document_intake_ocr/application/schemas/document_query_schema.py):
 *   { documents: DocumentDossierItemResponse[] }
 * donde cada item es { id: UUID, code: Optional[str], file_name: str,
 * source_id: Optional[str] }. El expediente se identifica por `batch_id` +
 * `dni_reference` (no por `case_id`): son documentos del contexto de intake.
 *
 * `id` llega como UUID serializado (string). `source_id` es una URI/URL (hasta
 * 500 chars) al origen del archivo; NO trae bytes ni una URL de imagen
 * embebible directa. Para el visor (fase UI): mapear `source_id` con
 * `toDriveThumbnailUrl` (`src/lib/drive-image.ts`) → `/api/drive-image`,
 * porque un `<img>` directo a Drive es throttleado (429/403) y la ruta del
 * backend por el proxy exige Bearer que un `<img>` no envía.
 */
import { z } from 'zod';

/** Documento individual del expediente (metadata mínima para el visor). */
export const documentDossierItemSchema = z.object({
  id: z.string(),
  code: z.string().nullable(),
  file_name: z.string(),
  source_id: z.string().nullable(),
});
export type DocumentDossierItem = z.infer<typeof documentDossierItemSchema>;

/** Respuesta del listado de documentos de un expediente. */
export const caseDocumentsSchema = z.object({
  documents: z.array(documentDossierItemSchema),
});
export type CaseDocuments = z.infer<typeof caseDocumentsSchema>;
