/**
 * Puente formulario ↔ `dossier_data` para la pantalla de corrección (TriajeCorreccion).
 *
 * El formulario edita una vista aplanada de `EducaDossierData` (con los adultos
 * como array indexado) y al guardar se reconstruye el `dossier_data` COMPLETO que
 * espera el PATCH (`useSubmitCorrection`). Reglas de fidelidad al backend:
 *  - Los booleanos de `education`/`medical` NO son nullable (toggle Sí/No).
 *  - Los de `religion`/`permissions` SÍ lo son (Sí/No/sin definir → `null`).
 *  - Los strings nullable se editan como '' y se re-convierten a `null` al guardar.
 *  - Los `validation_issues` no se editan: se preservan del expediente original.
 */
import type {
  EducaCase,
  EducaDossierData,
} from '../schemas/educa-case-schema';

/** Grupos que se renderizan como PESTAÑAS en el formulario de corrección. */
export const CORRECTION_GROUPS = [
  'Beneficiario',
  'Contactos y Apoderado',
  'Educación',
  'Salud',
  'Religión y permisos',
] as const;

/**
 * Grupo al que pertenece un campo. Los 5 de `CORRECTION_GROUPS` son las pestañas
 * visibles; 'Padre'/'Madre'/'Apoderado'/'Otro' son SUBGRUPOS contextuales sin
 * pestaña propia: solo se muestran al saltar a uno de sus campos desde el panel
 * de validación (`focusField` fija `activeGroup` al grupo del campo enfocado).
 * Por eso el tipo es un superconjunto de `CORRECTION_GROUPS`, no su derivado.
 */
export type CorrectionGroup =
  | (typeof CORRECTION_GROUPS)[number]
  | 'Padre'
  | 'Madre'
  | 'Apoderado'
  | 'Otro';

/** Un adulto relacionado tal como lo maneja el formulario (strings no-nulos). */
export interface AdultFormValue {
  relationship: string;
  dni: string;
  full_name: string;
  phone: string;
}

/**
 * Valores del formulario: espejo aplanado de `EducaDossierData`. Los strings
 * nullable del backend se representan como '' (nunca `null`) para los inputs; los
 * booleanos de `religion`/`permissions` conservan `null` ("sin definir").
 */
export interface CorrectionFormValues {
  beneficiary: {
    dni: string;
    first_name: string;
    last_name: string;
    birth_date: string;
    gender: string;
    address: string;
  };
  education: {
    school: string;
    grade: string;
    knows_read: boolean;
    knows_write: boolean;
    repeated_grade: boolean;
    learning_difficulties: boolean;
  };
  medical: {
    allergies: string[];
    diseases: string[];
    insurance: string[];
    has_been_operated: boolean;
    operation_reason: string;
    has_been_hospitalized: boolean;
    hospitalization_reason: string;
    vaccines: string[];
    medications: string[];
  };
  religion: {
    baptized: boolean | null;
    first_communion: boolean | null;
  };
  permissions: {
    haircut_permission: boolean | null;
    medical_exams_permission: boolean | null;
  };
  adults: AdultFormValue[];
  /**
   * ÍNDICE (como string) del adulto asignado como apoderado dentro de `adults`, o
   * '' si ninguno. Se referencia por índice —no por DNI— para que la asignación
   * sobreviva a correcciones del DNI; el DNI (`guardian_dni`) se resuelve al
   * guardar leyendo `adults[índice].dni` vivo (ver `formValuesToDossier`).
   */
  guardian_ref: string;
  /** Índice (como string) del adulto asignado como contacto de emergencia, o ''. */
  emergency_contact_ref: string;
}

/**
 * Valores iniciales vacíos del formulario. Se usan como `defaultValues` de
 * `useForm` antes de que llegue el expediente (y como base neutra); una vez
 * cargado, `dossierToFormValues` los reemplaza vía `form.reset`.
 */
export function emptyCorrectionValues(): CorrectionFormValues {
  return {
    beneficiary: {
      dni: '',
      first_name: '',
      last_name: '',
      birth_date: '',
      gender: '',
      address: '',
    },
    education: {
      school: '',
      grade: '',
      knows_read: false,
      knows_write: false,
      repeated_grade: false,
      learning_difficulties: false,
    },
    medical: {
      allergies: [],
      diseases: [],
      insurance: [],
      has_been_operated: false,
      operation_reason: '',
      has_been_hospitalized: false,
      hospitalization_reason: '',
      vaccines: [],
      medications: [],
    },
    religion: { baptized: null, first_communion: null },
    permissions: { haircut_permission: null, medical_exams_permission: null },
    adults: [],
    guardian_ref: '',
    emergency_contact_ref: '',
  };
}

const s = (v: string | null | undefined): string => v ?? '';
/** '' (o solo espacios) → `null`; en otro caso el texto recortado. */
const emptyToNull = (v: string): string | null => {
  const t = v.trim();
  return t.length ? t : null;
};

/**
 * DNI (guardado por el backend) → índice del adulto en la lista, como string
 * ('' si ninguno). `findIndex` toma la primera aparición, consistente con la
 * deduplicación por DNI de `buildAdultRefOptions`.
 */
const refFromDni = (
  adults: EducaDossierData['related_adults']['adults'],
  dni: string | null
): string => {
  if (!dni) return '';
  const i = adults.findIndex((a) => a.dni === dni);
  return i >= 0 ? String(i) : '';
};

/**
 * Inversa al guardar: índice (string) → DNI VIVO del adulto (`values.adults[i].dni`),
 * o null si el índice está vacío o fuera de rango. Resuelve contra los valores
 * actuales del formulario, así refleja cualquier corrección del DNI.
 */
const dniFromRef = (values: CorrectionFormValues, ref: string): string | null => {
  if (!ref) return null;
  const i = Number(ref);
  if (!Number.isInteger(i) || i < 0 || i >= values.adults.length) return null;
  return emptyToNull(values.adults[i].dni);
};

/** `EducaDossierData` (respuesta) → valores iniciales del formulario. */
export function dossierToFormValues(d: EducaDossierData): CorrectionFormValues {
  return {
    beneficiary: {
      dni: s(d.beneficiary.dni),
      first_name: s(d.beneficiary.first_name),
      last_name: s(d.beneficiary.last_name),
      birth_date: s(d.beneficiary.birth_date),
      gender: s(d.beneficiary.gender),
      address: s(d.beneficiary.address),
    },
    education: {
      school: s(d.education.school),
      grade: s(d.education.grade),
      knows_read: d.education.knows_read,
      knows_write: d.education.knows_write,
      repeated_grade: d.education.repeated_grade,
      learning_difficulties: d.education.learning_difficulties,
    },
    medical: {
      allergies: [...d.medical.allergies],
      diseases: [...d.medical.diseases],
      insurance: [...d.medical.insurance],
      has_been_operated: d.medical.has_been_operated,
      operation_reason: s(d.medical.operation_reason),
      has_been_hospitalized: d.medical.has_been_hospitalized,
      hospitalization_reason: s(d.medical.hospitalization_reason),
      vaccines: [...d.medical.vaccines],
      medications: [...d.medical.medications],
    },
    religion: {
      baptized: d.religion.baptized,
      first_communion: d.religion.first_communion,
    },
    permissions: {
      haircut_permission: d.permissions.haircut_permission,
      medical_exams_permission: d.permissions.medical_exams_permission,
    },
    adults: d.related_adults.adults.map((a) => ({
      relationship: a.relationship,
      dni: s(a.dni),
      full_name: s(a.full_name),
      phone: s(a.phone),
    })),
    guardian_ref: refFromDni(d.related_adults.adults, d.related_adults.guardian_dni),
    emergency_contact_ref: refFromDni(
      d.related_adults.adults,
      d.related_adults.emergency_contact_dni
    ),
  };
}

/**
 * Valores del formulario → `EducaDossierData` COMPLETO para el PATCH. Preserva
 * los `validation_issues` del expediente original (no se editan en la UI) y
 * re-convierte los strings vacíos a `null` donde el backend lo espera.
 */
export function formValuesToDossier(
  values: CorrectionFormValues,
  original: EducaDossierData
): EducaDossierData {
  return {
    beneficiary: {
      dni: emptyToNull(values.beneficiary.dni),
      first_name: emptyToNull(values.beneficiary.first_name),
      last_name: emptyToNull(values.beneficiary.last_name),
      birth_date: emptyToNull(values.beneficiary.birth_date),
      gender: emptyToNull(values.beneficiary.gender),
      address: emptyToNull(values.beneficiary.address),
      validation_issues: original.beneficiary.validation_issues,
    },
    related_adults: {
      adults: values.adults.map((a) => ({
        relationship: a.relationship,
        dni: emptyToNull(a.dni),
        full_name: emptyToNull(a.full_name),
        phone: emptyToNull(a.phone),
      })),
      // Apoderado y contacto de emergencia: la UI guarda el ÍNDICE del adulto;
      // aquí se resuelve al DNI VIVO (`values.adults[índice].dni`), así se manda
      // el DNI corregido si el revisor lo editó. '' o índice inválido → null.
      guardian_dni: dniFromRef(values, values.guardian_ref),
      emergency_contact_dni: dniFromRef(values, values.emergency_contact_ref),
      validation_issues: original.related_adults.validation_issues,
    },
    education: {
      school: emptyToNull(values.education.school),
      grade: emptyToNull(values.education.grade),
      knows_read: values.education.knows_read,
      knows_write: values.education.knows_write,
      repeated_grade: values.education.repeated_grade,
      learning_difficulties: values.education.learning_difficulties,
    },
    medical: {
      allergies: values.medical.allergies,
      diseases: values.medical.diseases,
      insurance: values.medical.insurance,
      has_been_operated: values.medical.has_been_operated,
      operation_reason: emptyToNull(values.medical.operation_reason),
      has_been_hospitalized: values.medical.has_been_hospitalized,
      hospitalization_reason: emptyToNull(values.medical.hospitalization_reason),
      vaccines: values.medical.vaccines,
      medications: values.medical.medications,
    },
    religion: {
      baptized: values.religion.baptized,
      first_communion: values.religion.first_communion,
      validation_issues: original.religion.validation_issues,
    },
    permissions: {
      haircut_permission: values.permissions.haircut_permission,
      medical_exams_permission: values.permissions.medical_exams_permission,
      validation_issues: original.permissions.validation_issues,
    },
  };
}

/**
 * Etiqueta legible del PARENTESCO base de un adulto. "Apoderado" y "contacto de
 * emergencia" NO son parentescos: son roles asignables (ver los selectores de la
 * pestaña Apoderado), así que cualquier adulto que no sea padre ni madre —incluido
 * el apoderado escaneado por OCR (rol `OTHER`)— se rotula "Otro".
 */
export function relationshipLabel(relationship: string): string {
  if (relationship === 'FATHER') return 'Padre';
  if (relationship === 'MOTHER') return 'Madre';
  return 'Otro';
}

/** Índices de padre/madre dentro del array de adultos (`-1` si no existen). */
export function resolveAdultIndices(caseData: EducaCase) {
  const adults = caseData.dossier_data.related_adults.adults;
  return {
    father: adults.findIndex((a) => a.relationship === 'FATHER'),
    mother: adults.findIndex((a) => a.relationship === 'MOTHER'),
  };
}
