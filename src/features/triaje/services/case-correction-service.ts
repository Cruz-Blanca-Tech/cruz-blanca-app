import { apiClient } from '@/lib/api-client';
import { parseApiResponse } from '@/lib/parse-api-response';
import { API_PATHS } from '@/lib/api-paths';
import {
  educaCaseSchema,
  educaCaseDetailSchema,
  educaRejectSchema,
  type EducaCase,
  type EducaCaseDetail,
  type EducaDossierData,
  type EducaReject,
} from '../schemas/educa-case-schema';
import {
  caseDocumentsSchema,
  type CaseDocuments,
} from '../schemas/case-documents-schema';

/**
 * Servicio de CORRECCIÓN de un expediente EDUCA (contexto de Triaje). Cubre la
 * futura pantalla TriajeCorreccion: lectura del expediente y, más adelante, el
 * guardado de correcciones (PATCH) y el rechazo. El prefijo del expediente sale
 * de `API_PATHS.educa` (`/api/v1/triage/educa`). Las rutas se resuelven contra
 * el proxy (`/api/proxy`), que inyecta el Bearer.
 */
export const caseCorrectionService = {
  /**
   * GET /educa/{caseId} — expediente EDUCA para la corrección manual. Sin body
   * ni query params: solo el `caseId` (UUID). El backend responde 404 si no
   * existe y 400 si el expediente no es de tipo `EDUCA_INSCRIPTION`.
   */
  async getEducaCase(caseId: string): Promise<EducaCase> {
    const data = await apiClient.get(`${API_PATHS.educa}/${caseId}`);
    return parseApiResponse(educaCaseSchema, data, 'el expediente EDUCA');
  },

  /**
   * GET /batches/{batchId}/dossiers/{dniRef}/documents — documentos (imágenes)
   * del expediente para el visor. OJO: usa `API_PATHS.batches` (contexto intake,
   * doble `/api/v1`), no `educa`: los documentos se identifican por
   * `batch_id` + `dni_reference`, no por `case_id`. `dniRef` es el identificador
   * ESTABLE del dossier (`triageCaseListItem.dni_reference`), no el
   * `beneficiary.dni` extraído por OCR (que puede estar mal y es lo que se
   * corrige en esta pantalla). Sin body ni query params.
   */
  async getCaseDocuments(batchId: string, dniRef: string): Promise<CaseDocuments> {
    const data = await apiClient.get(
      `${API_PATHS.batches}/${batchId}/dossiers/${dniRef}/documents`
    );
    return parseApiResponse(caseDocumentsSchema, data, 'los documentos del expediente');
  },

  /**
   * PATCH /educa/{caseId} — guarda la corrección manual del expediente. El body
   * es el `dossier_data` COMPLETO al nivel raíz (no envuelto), con la misma forma
   * que el `dossier_data` del GET (`EducaDossierData`). El backend responde un
   * SUPERSET del GET (`EducaTriageCaseDetailResponse`): núcleo + `id`, `batch_id`,
   * `dni_reference`, `verdict`, `confidence_scores`.
   *
   * Guardar ≠ aprobar: HTTP 200 solo significa "persistido"; usa
   * `isEducaCaseApproved(res)` para saber si quedó aprobado.
   */
  async submitCorrection(
    caseId: string,
    correctedData: EducaDossierData
  ): Promise<EducaCaseDetail> {
    const data = await apiClient.patch(`${API_PATHS.educa}/${caseId}`, correctedData);
    return parseApiResponse(educaCaseDetailSchema, data, 'la corrección del expediente');
  },

  /**
   * POST /educa/{caseId}/reject — rechaza el expediente indicando un motivo. El
   * backend exige `reason` (obligatorio) en el body. Responde un dict de
   * confirmación (`{ case_id, message }`), no el expediente.
   */
  async rejectCase(caseId: string, reason: string): Promise<EducaReject> {
    const data = await apiClient.post(`${API_PATHS.educa}/${caseId}/reject`, {
      reason,
    });
    return parseApiResponse(educaRejectSchema, data, 'el rechazo del expediente');
  },
};
