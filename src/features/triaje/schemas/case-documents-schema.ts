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
 * `id` llega como UUID serializado (string). `source_id` es la URI del ORIGEN
 * (Drive personal del voluntario) y NO sirve para el visor: es privado y no
 * embebible. La imagen real vive en la bóveda de Custodia y solo la baja el
 * "robot" (cuenta de servicio) del backend. Por eso el visor NO usa `source_id`:
 * construye `/api/case-doc-image?batchId=&dni=&docId=` (ruta Next autenticada que
 * reenvía el Bearer al endpoint `.../documents/{id}/image` del backend, el cual
 * resuelve el `custody_id` y devuelve los bytes). Así el navegador nunca ve el
 * enlace de Drive y se preserva la privacidad de la bóveda.
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
