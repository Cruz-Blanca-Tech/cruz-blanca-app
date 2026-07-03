/**
 * Expediente EDUCA para la pantalla de corrección
 * (GET /api/v1/triage/educa/{case_id}).
 *
 * El backend tipa la respuesta con `EducaTriageCasePreviewResponse`
 * (data_quality_triage/application/educa/schemas/educa_inscription_schemas.py):
 *   { status, dossier_data: EducaInscriptionData, discrepancies: DiscrepancySchema[] }
 *
 * `dossier_data` se reconstituye vía dominio (`DossierFactory.reconstitute` →
 * `asdict`) y el `response_model` lo coacciona a `EducaInscriptionData`, así que
 * la forma servible es exactamente la de esos sub-schemas (beneficiary, family,
 * education, medical, religion, permissions). Esta es la forma que valida este
 * schema y es el NÚCLEO que el PATCH extiende (ver `educaCaseSchema.extend`).
 *
 * Fidelidad al backend (no al mockup): los booleanos de `education`/`medical`
 * NO son nullable (`bool = False` en Pydantic); solo lo son los de `religion` y
 * `permissions` (`Optional[bool] = None`). `status` llega como string plano
 * (`.value` del enum `TriageStatus`) → `z.string()` para no romper ante valores
 * nuevos, igual que el resto del feature.
 */
import { z } from 'zod';
import { triageDiscrepancySchema } from './triage-discrepancy-schema';

/** Datos del beneficiario (menor inscrito). Todos los strings pueden faltar. */
const beneficiarySchema = z.object({
  dni: z.string().nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  birth_date: z.string().nullable(),
  gender: z.string().nullable(),
  address: z.string().nullable(),
  validation_issues: z.array(z.string()),
});

/** Adulto relacionado (apoderado/familiar). `relationship` es obligatorio. */
const relatedAdultSchema = z.object({
  relationship: z.string(),
  dni: z.string().nullable(),
  full_name: z.string().nullable(),
  phone: z.string().nullable(),
});

/** Núcleo familiar: adultos relacionados + apoderado + contacto de emergencia. */
const familySchema = z.object({
  adults: z.array(relatedAdultSchema),
  guardian_dni: z.string().nullable(),
  emergency_contact_dni: z.string().nullable(),
  validation_issues: z.array(z.string()),
});

/** Datos educativos. Los booleanos NO son nullable (default `false`). */
const educationSchema = z.object({
  school: z.string().nullable(),
  grade: z.string().nullable(),
  knows_read: z.boolean(),
  knows_write: z.boolean(),
  repeated_grade: z.boolean(),
  learning_difficulties: z.boolean(),
});

/** Ficha médica. Los booleanos NO son nullable (default `false`). */
const medicalSchema = z.object({
  allergies: z.array(z.string()),
  diseases: z.array(z.string()),
  insurance: z.array(z.string()),
  has_been_operated: z.boolean(),
  operation_reason: z.string().nullable(),
  has_been_hospitalized: z.boolean(),
  hospitalization_reason: z.string().nullable(),
  vaccines: z.array(z.string()),
  medications: z.array(z.string()),
});

/** Datos religiosos. Aquí los booleanos SÍ son nullable (`Optional[bool]`). */
const religionSchema = z.object({
  baptized: z.boolean().nullable(),
  first_communion: z.boolean().nullable(),
  validation_issues: z.array(z.string()),
});

/** Permisos otorgados. Booleanos nullable (`Optional[bool]`). */
const permissionsSchema = z.object({
  haircut_permission: z.boolean().nullable(),
  medical_exams_permission: z.boolean().nullable(),
  validation_issues: z.array(z.string()),
});

/** `dossier_data`: expediente EDUCA completo (`EducaInscriptionData`). */
export const educaDossierDataSchema = z.object({
  beneficiary: beneficiarySchema,
  related_adults: familySchema,
  education: educationSchema,
  medical: medicalSchema,
  religion: religionSchema,
  permissions: permissionsSchema,
});
export type EducaDossierData = z.infer<typeof educaDossierDataSchema>;

/**
 * Schema base del expediente EDUCA (respuesta del GET). Es el NÚCLEO que la
 * mutación PATCH extiende con `id`, `batch_id`, `dni_reference`, `verdict` y
 * `confidence_scores` (ver Parte 4), así que no se duplica: se reutiliza vía
 * `.extend()`.
 */
export const educaCaseSchema = z.object({
  status: z.string(),
  dossier_data: educaDossierDataSchema,
  discrepancies: z.array(triageDiscrepancySchema),
});
export type EducaCase = z.infer<typeof educaCaseSchema>;

/**
 * Respuesta del PATCH (`EducaTriageCaseDetailResponse`): es un SUPERSET del GET
 * — el núcleo (`status`, `dossier_data`, `discrepancies`) más los identificadores
 * y el resultado del triaje. Se extiende `educaCaseSchema` para no duplicar el
 * núcleo. `verdict` llega como string plano (`.value` del enum `TriageVerdict`);
 * `confidence_scores` es un mapa campo → score (`Dict[str, float]`).
 *
 * Ojo: `dossier_data` aquí es el crudo enviado en el PATCH (no la reconstitución
 * de dominio del GET); ambos comparten forma porque pasan por el mismo
 * `response_model`, así que se valida con el mismo `educaDossierDataSchema`.
 */
export const educaCaseDetailSchema = educaCaseSchema.extend({
  id: z.string(),
  batch_id: z.string(),
  dni_reference: z.string(),
  verdict: z.string(),
  confidence_scores: z.record(z.string(), z.number()),
});
export type EducaCaseDetail = z.infer<typeof educaCaseDetailSchema>;

/**
 * Respuesta de POST /educa/{caseId}/reject. Es un dict literal del backend (sin
 * `response_model`), NO el expediente: solo confirma el rechazo. Como no trae el
 * estado del caso, el hook no puede sembrar el caché con esto (lo invalida).
 */
export const educaRejectSchema = z.object({
  case_id: z.string(),
  message: z.string(),
});
export type EducaReject = z.infer<typeof educaRejectSchema>;

/**
 * Guardar ≠ aprobar. El PATCH persiste aunque falten campos (HTTP 200 no implica
 * aprobado), así que la UI necesita este helper para distinguir "guardado" de
 * "listo/aprobado" sin mirar el código HTTP. Un expediente está aprobado cuando
 * su estado es `APPROVED` y no le quedan discrepancias (equivale a que el backend
 * fije `verdict === 'MANUALLY_APPROVED'`).
 */
export function isEducaCaseApproved(
  res: Pick<EducaCase, 'status' | 'discrepancies'>
): boolean {
  return res.status === 'APPROVED' && res.discrepancies.length === 0;
}
