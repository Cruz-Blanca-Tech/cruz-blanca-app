export type ActivityTemplateId = 'EDUCA_INSCRIPTION' | 'MEDICAL_CAMPAIGN';

export interface ActivityTemplate {
  id: ActivityTemplateId;
  /** Etiqueta visible del tipo de trámite (columna "Tipo de Trámite" y select). */
  label: string;
  /**
   * Substrings de nombre de programa (match case-insensitive) a los que aplica
   * la plantilla. Coincide con el comportamiento original (nombre del programa
   * contiene el substring).
   */
  programMatches: string[];
  /** Códigos de documento del catálogo (campo `code`) que exige la plantilla. */
  requiredDocCodes: string[];
}

/**
 * Plantillas de trámite del MDM y su vinculación a Programas (por nombre).
 * Determinan qué documentos debe exigir la actividad recién creada.
 */
export const ACTIVITY_TEMPLATES: ActivityTemplate[] = [
  {
    id: 'EDUCA_INSCRIPTION',
    label: 'Inscripción Educa',
    programMatches: ['Educa'],
    requiredDocCodes: ['FINS', 'DJ', 'DNIAP', 'DNIBE'],
  },
  {
    id: 'MEDICAL_CAMPAIGN',
    label: 'Campaña Médica',
    programMatches: ['En Familia', 'Familia'],
    requiredDocCodes: ['FINS'],
  },
];

export function findTemplateById(id: string | null | undefined): ActivityTemplate | undefined {
  if (!id) return undefined;
  return ACTIVITY_TEMPLATES.find((template) => template.id === id);
}