/**
 * Traducciones de los enums del backend al español.
 *
 * ÚNICA fuente de verdad para etiquetas de presentación en toda la app.
 * No hardcodear traducciones en componentes individuales.
 *
 * Convención de uso:
 *   - Importar la función helper (ej: `getRelationshipLabel(role)`)
 *   - Si necesitas el mapa completo, importa la constante `*_LABELS`
 */

// ---------------------------------------------------------------------------
// RelationshipRole — parentesco del adulto relacionado al beneficiario
// ---------------------------------------------------------------------------

/**
 * Roles seleccionables manualmente en los formularios: FATHER, MOTHER,
 * GRANDPARENT y OTHER. SIBLING se asigna automáticamente por el sistema
 * (nunca se expone en el select). TUTOR fue eliminado del dominio.
 */
export const SELECTABLE_RELATIONSHIP_ROLES = [
  'FATHER',
  'MOTHER',
  'GRANDPARENT',
  'OTHER',
] as const;

export const RELATIONSHIP_LABELS: Record<string, string> = {
  FATHER: 'Padre',
  MOTHER: 'Madre',
  GRANDPARENT: 'Abuelo/a',
  /** Asignado automáticamente por el sistema al importar hermanos. */
  SIBLING: 'Hermano/a',
  /** No se usa en nuevos ingresos. Solo por compatibilidad con registros legados. */
  TUTOR: 'Tutor Legal',
  OTHER: 'Familiar',
};

/**
 * Etiqueta legible del parentesco. Devuelve el valor raw si no hay traducción
 * (forward-compat ante nuevos valores del backend).
 */
export function getRelationshipLabel(role?: string | null): string {
  if (!role) return 'Familiar';
  return RELATIONSHIP_LABELS[role.toUpperCase()] ?? role;
}

// ---------------------------------------------------------------------------
// Gender — género del beneficiario o adulto
// ---------------------------------------------------------------------------

export const GENDER_LABELS: Record<string, string> = {
  MALE: 'Masculino',
  FEMALE: 'Femenino',
  OTHER: 'Otro',
  UNKNOWN: 'Sin especificar',
};

/** Etiqueta legible del género. Devuelve `'—'` si no hay dato. */
export function getGenderLabel(gender?: string | null): string {
  if (!gender) return '—';
  return GENDER_LABELS[gender.toUpperCase()] ?? gender;
}

// ---------------------------------------------------------------------------
// TriageStatus — estado del expediente en el flujo de triaje
// ---------------------------------------------------------------------------

export const TRIAGE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En revisión',
  INCOMPLETE: 'Incompleto',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
};

/** Etiqueta legible del estado de triaje. */
export function getTriageStatusLabel(status?: string | null): string {
  if (!status) return '—';
  return TRIAGE_STATUS_LABELS[status.toUpperCase()] ?? status;
}

// ---------------------------------------------------------------------------
// TriageVerdict — veredicto del motor de triaje
// ---------------------------------------------------------------------------

export const TRIAGE_VERDICT_LABELS: Record<string, string> = {
  AUTO_APPROVED: 'Aprobado automáticamente',
  MANUALLY_APPROVED: 'Aprobado manualmente',
  REJECTED: 'Rechazado',
  PENDING: 'Pendiente de revisión',
};

/** Etiqueta legible del veredicto de triaje. */
export function getTriageVerdictLabel(verdict?: string | null): string {
  if (!verdict) return '—';
  return TRIAGE_VERDICT_LABELS[verdict.toUpperCase()] ?? verdict;
}

// ---------------------------------------------------------------------------
// SyncStatus — estado de sincronización con el MDM
// ---------------------------------------------------------------------------

export const SYNC_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente de sincronización',
  SYNCING: 'Sincronizando…',
  SYNCED: 'Sincronizado',
  ERROR: 'Error de sincronización',
};

/** Etiqueta legible del estado de sincronización. */
export function getSyncStatusLabel(status?: string | null): string {
  if (!status) return '—';
  return SYNC_STATUS_LABELS[status.toUpperCase()] ?? status;
}

// ---------------------------------------------------------------------------
// GradeLevel — grado escolar
// ---------------------------------------------------------------------------

export const GRADE_LABELS: Record<string, string> = {
  INICIAL_3: 'Inicial 3 años',
  INICIAL_4: 'Inicial 4 años',
  INICIAL_5: 'Inicial 5 años',
  '1RO_PRIMARIA': '1ro Primaria',
  '2DO_PRIMARIA': '2do Primaria',
  '3RO_PRIMARIA': '3ro Primaria',
  '4TO_PRIMARIA': '4to Primaria',
  '5TO_PRIMARIA': '5to Primaria',
  '6TO_PRIMARIA': '6to Primaria',
  '1RO_SECUNDARIA': '1ro Secundaria',
  '2DO_SECUNDARIA': '2do Secundaria',
  '3RO_SECUNDARIA': '3ro Secundaria',
  '4TO_SECUNDARIA': '4to Secundaria',
  '5TO_SECUNDARIA': '5to Secundaria',
  SUPERIOR: 'Educación Superior',
  NINGUNO: 'Ninguno / No Aplica',
};

/** Etiqueta legible del grado escolar. */
export function getGradeLabel(grade?: string | null): string {
  if (!grade) return '—';
  return GRADE_LABELS[grade.toUpperCase()] ?? grade;
}
