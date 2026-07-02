/**
 * Descriptores de los campos del formulario de corrección y derivación de su
 * estado de validación.
 *
 * La validación es del BACKEND: las `discrepancies` del expediente (al cargar y
 * tras el PATCH) son la fuente de verdad. Cada descriptor declara con qué
 * discrepancia(s) se corresponde (`matchFieldNames` / `matchDocCodes`, igual que
 * el `buildFields` del mockup) para pintar su estado y permitir el salto a campo.
 * El único juicio del cliente es "por completar" (campo vacío sin observación).
 */
import type { EducaCase } from '../schemas/educa-case-schema';
import type { TriageDiscrepancy } from '../schemas/triage-discrepancy-schema';
import {
  relationshipLabel,
  resolveAdultIndices,
  type AdultFormValue,
  type CorrectionGroup,
} from './correction-form';

/** Opciones canónicas de los multi-select (de la ficha de inscripción EDUCA). */
export const INSURANCE_OPTIONS = ['S.I.S.', 'ESSALUD', 'FOSPOLI'];
export const ALLERGY_OPTIONS = [
  'Analgésicos (AINES)',
  'Sulfas',
  'Penicilina',
  'Pescado / Mariscos',
  'Cítricos',
  'Leche',
];
export const DISEASE_OPTIONS = [
  'Tuberculosis',
  'Convulsiones',
  'Cáncer',
  'Varicela',
  'Parásitos',
];

export interface SelectOption {
  value: string;
  label: string;
  /**
   * Texto a mostrar en el trigger cuando la opción está seleccionada, si debe
   * diferir del `label` del listado (p. ej. el listado muestra el DNI para
   * desambiguar, pero el trigger solo el nombre y el rol). Si se omite, el
   * trigger usa `label`.
   */
  triggerLabel?: string;
}

export type FieldControl =
  | 'text'
  | 'date'
  | 'select'
  | 'bool'
  | 'multi'
  | 'readonly';

export interface CorrectionFieldDescriptor {
  /** Id estable para refs, foco y salto desde el panel. */
  id: string;
  /** Ruta RHF (dot-path) dentro de `CorrectionFormValues`; `null` si es derivado. */
  name: string | null;
  label: string;
  group: CorrectionGroup;
  control: FieldControl;
  /** Opciones de `select` (con value/label) o `multi` (labels). */
  selectOptions?: SelectOption[];
  multiOptions?: string[];
  freeform?: boolean;
  otrosLabel?: string;
  /** Booleano nullable (religión/permisos): admite "sin definir". */
  nullableBool?: boolean;
  /** Vacío aceptable: no se marca como "por completar". */
  emptyOk?: boolean;
  /** Teléfono de emergencia (marca visual). */
  emergency?: boolean;
  note?: string;
  placeholder?: string;
  /** Solo lectura (derivado de UI, no se envía). `age` = edad desde birth_date. */
  derive?: 'age';
  /**
   * Selector cuyas opciones son los adultos registrados (apoderado / contacto de
   * emergencia). Las opciones NO se fijan aquí: se construyen en vivo desde los
   * valores del formulario (`buildAdultRefOptions`), y el valor es el ÍNDICE del
   * adulto, no su DNI, para que la referencia sobreviva a correcciones del DNI
   * (el DNI se resuelve al guardar, ver `formValuesToDossier`).
   */
  adultRefSelect?: boolean;
  matchFieldNames?: string[];
  matchDocCodes?: string[];
}

/**
 * Opciones de los selectores de rol (apoderado / contacto de emergencia) a partir
 * de los adultos VIVOS del formulario. El `value` es el índice del adulto (estable
 * ante correcciones del DNI); el listado muestra `nombre · rol — DNI` y el trigger
 * solo `nombre · rol`. Se deduplica por DNI (mismo DNI = misma persona) quedándose
 * con la primera aparición, consistente con el `findIndex` de `dossierToFormValues`.
 */
export function buildAdultRefOptions(adults: AdultFormValue[]): SelectOption[] {
  const options: SelectOption[] = [];
  const seenDni = new Set<string>();
  adults.forEach((a, i) => {
    const dni = a.dni.trim();
    if (!dni || seenDni.has(dni)) return;
    seenDni.add(dni);
    const nameRole = `${a.full_name.trim() || 'Sin nombre'} · ${relationshipLabel(a.relationship)}`;
    options.push({ value: String(i), label: `${nameRole} — ${dni}`, triggerLabel: nameRole });
  });
  return options;
}

/** Construye los descriptores a partir del expediente (indices de adultos incl.). */
export function buildCorrectionFields(
  caseData: EducaCase
): CorrectionFieldDescriptor[] {
  const { father, mother } = resolveAdultIndices(caseData);
  const adults = caseData.dossier_data.related_adults.adults;

  // Adultos que NO son padre ni madre (tutores, terceros): al pasar el apoderado
  // a ser un rol asignable (y no una pestaña con sus campos), estos adultos
  // perderían su única superficie de edición. Se editan aquí, en la pestaña
  // Apoderado, para no perder esa capacidad.
  const otherAdultIndices = adults
    .map((_, i) => i)
    .filter((i) => i !== father && i !== mother);

  // El `id` de cada campo es estable por grupo (`padre.*`, `madre.*`, `otro-N.*`)
  // y se usa para refs, saltos, conteos y estado de validación; la ruta RHF
  // (`name`) apunta al índice real del adulto en `adults`. Se separan porque el
  // `id` debe ser único/estable mientras que el `name` debe apuntar al dato editado.
  const adultFields = (
    index: number,
    group: CorrectionGroup,
    idPrefix: string,
    labels: { name: string; dni: string; phone: string },
    extra?: {
      phoneEmergency?: boolean;
      phoneMatchFieldNames?: string[];
      nameNote?: string;
    }
  ): CorrectionFieldDescriptor[] => {
    if (index < 0) {
      return [
        {
          id: `${idPrefix}.empty`,
          name: null,
          label: labels.name,
          group,
          control: 'readonly',
          placeholder: 'No registrado',
          emptyOk: true,
        },
      ];
    }
    const base = `adults.${index}`;
    return [
      {
        id: `${idPrefix}.full_name`,
        name: `${base}.full_name`,
        label: labels.name,
        group,
        control: 'text',
        placeholder: 'No registrado',
        note: extra?.nameNote,
      },
      {
        id: `${idPrefix}.dni`,
        name: `${base}.dni`,
        label: labels.dni,
        group,
        control: 'text',
        placeholder: 'No registrado',
      },
      {
        id: `${idPrefix}.phone`,
        name: `${base}.phone`,
        label: labels.phone,
        group,
        control: 'text',
        placeholder: 'Sin teléfono',
        emergency: extra?.phoneEmergency,
        emptyOk: !extra?.phoneEmergency,
        matchFieldNames: extra?.phoneMatchFieldNames,
      },
    ];
  };

  return [
    // Beneficiario
    {
      id: 'beneficiary.first_name',
      name: 'beneficiary.first_name',
      label: 'Nombres',
      group: 'Beneficiario',
      control: 'text',
    },
    {
      id: 'beneficiary.last_name',
      name: 'beneficiary.last_name',
      label: 'Apellidos',
      group: 'Beneficiario',
      control: 'text',
    },
    {
      id: 'beneficiary.dni',
      name: 'beneficiary.dni',
      label: 'DNI del niño',
      group: 'Beneficiario',
      control: 'text',
      matchFieldNames: ['Número de Documento'],
      matchDocCodes: ['DNIBE'],
    },
    {
      id: 'beneficiary.birth_date',
      name: 'beneficiary.birth_date',
      label: 'Fecha de nacimiento',
      group: 'Beneficiario',
      control: 'date',
    },
    {
      id: 'beneficiary.age',
      name: null,
      label: 'Edad (años)',
      group: 'Beneficiario',
      control: 'readonly',
      derive: 'age',
      emptyOk: true,
    },
    {
      id: 'beneficiary.gender',
      name: 'beneficiary.gender',
      label: 'Género',
      group: 'Beneficiario',
      control: 'select',
      selectOptions: [
        { value: 'F', label: 'Femenino' },
        { value: 'M', label: 'Masculino' },
      ],
    },
    {
      id: 'beneficiary.address',
      name: 'beneficiary.address',
      label: 'Dirección',
      group: 'Beneficiario',
      control: 'text',
      placeholder: 'No consignada en la ficha',
      emptyOk: true,
    },

    // Educación
    {
      id: 'education.school',
      name: 'education.school',
      label: 'Colegio',
      group: 'Educación',
      control: 'text',
    },
    {
      id: 'education.grade',
      name: 'education.grade',
      label: 'Grado',
      group: 'Educación',
      control: 'text',
    },
    {
      id: 'education.knows_read',
      name: 'education.knows_read',
      label: '¿Sabe leer?',
      group: 'Educación',
      control: 'bool',
    },
    {
      id: 'education.knows_write',
      name: 'education.knows_write',
      label: '¿Sabe escribir?',
      group: 'Educación',
      control: 'bool',
    },
    {
      id: 'education.repeated_grade',
      name: 'education.repeated_grade',
      label: '¿Ha repetido de grado?',
      group: 'Educación',
      control: 'bool',
    },
    {
      id: 'education.learning_difficulties',
      name: 'education.learning_difficulties',
      label: '¿Dificultades de aprendizaje?',
      group: 'Educación',
      control: 'bool',
    },

    // Salud
    {
      id: 'medical.insurance',
      name: 'medical.insurance',
      label: 'Tipo de seguro',
      group: 'Salud',
      control: 'multi',
      multiOptions: INSURANCE_OPTIONS,
      otrosLabel: 'Otro — ¿Cuál?',
    },
    {
      id: 'medical.allergies',
      name: 'medical.allergies',
      label: 'Alergias',
      group: 'Salud',
      control: 'multi',
      multiOptions: ALLERGY_OPTIONS,
      otrosLabel: 'Otros — ¿Qué?',
      emptyOk: true,
    },
    {
      id: 'medical.diseases',
      name: 'medical.diseases',
      label: 'Enfermedades que ha tenido',
      group: 'Salud',
      control: 'multi',
      multiOptions: DISEASE_OPTIONS,
      otrosLabel: 'Otros',
      emptyOk: true,
    },
    {
      id: 'medical.vaccines',
      name: 'medical.vaccines',
      label: 'Vacunas',
      group: 'Salud',
      control: 'multi',
      multiOptions: [],
      freeform: true,
      otrosLabel: 'Agregar vacuna',
      emptyOk: true,
    },
    {
      id: 'medical.medications',
      name: 'medical.medications',
      label: 'Medicamentos',
      group: 'Salud',
      control: 'multi',
      multiOptions: [],
      freeform: true,
      otrosLabel: 'Agregar medicamento',
      emptyOk: true,
    },
    {
      id: 'medical.has_been_operated',
      name: 'medical.has_been_operated',
      label: '¿Ha sido operado?',
      group: 'Salud',
      control: 'bool',
    },
    {
      id: 'medical.operation_reason',
      name: 'medical.operation_reason',
      label: 'Motivo de operación',
      group: 'Salud',
      control: 'text',
      placeholder: 'Sin motivo registrado',
      emptyOk: true,
    },
    {
      id: 'medical.has_been_hospitalized',
      name: 'medical.has_been_hospitalized',
      label: '¿Ha sido hospitalizado?',
      group: 'Salud',
      control: 'bool',
    },
    {
      id: 'medical.hospitalization_reason',
      name: 'medical.hospitalization_reason',
      label: 'Motivo de hospitalización',
      group: 'Salud',
      control: 'text',
      placeholder: 'Sin motivo registrado',
      emptyOk: true,
    },

    // Religión y permisos (booleanos nullable)
    {
      id: 'religion.baptized',
      name: 'religion.baptized',
      label: '¿Fue bautizado?',
      group: 'Religión y permisos',
      control: 'bool',
      nullableBool: true,
    },
    {
      id: 'religion.first_communion',
      name: 'religion.first_communion',
      label: '¿Hizo la 1ra comunión?',
      group: 'Religión y permisos',
      control: 'bool',
      nullableBool: true,
    },
    {
      id: 'permissions.haircut_permission',
      name: 'permissions.haircut_permission',
      label: '¿Autoriza corte de cabello?',
      group: 'Religión y permisos',
      control: 'bool',
      nullableBool: true,
    },
    {
      id: 'permissions.medical_exams_permission',
      name: 'permissions.medical_exams_permission',
      label: '¿Autoriza exámenes médicos?',
      group: 'Religión y permisos',
      control: 'bool',
      nullableBool: true,
    },

    // Padre / Madre / Apoderado (desde related_adults.adults[])
    ...adultFields(father, 'Padre', 'padre', {
      name: 'Nombre del padre',
      dni: 'DNI del padre',
      phone: 'Teléfono del padre',
    }),
    ...adultFields(mother, 'Madre', 'madre', {
      name: 'Nombre de la madre',
      dni: 'DNI de la madre',
      phone: 'Teléfono de la madre',
    }),
    // Apoderado y contacto de emergencia: roles asignables a un adulto registrado.
    // El valor es el ÍNDICE del adulto (no su DNI); las opciones se construyen en
    // vivo (`adultRefSelect`) desde el form, y el DNI se resuelve al guardar. Así,
    // si corriges el DNI de un adulto y luego lo eliges, se manda el DNI corregido.
    {
      id: 'apoderado.guardian_dni',
      name: 'guardian_ref',
      label: 'Apoderado',
      group: 'Apoderado',
      control: 'select',
      adultRefSelect: true,
      matchFieldNames: ['related_adults.guardian_dni'],
      note: 'Elige cuál de los adultos registrados es el apoderado.',
    },
    {
      id: 'apoderado.emergency_contact_dni',
      name: 'emergency_contact_ref',
      label: 'Contacto de emergencia',
      group: 'Apoderado',
      control: 'select',
      adultRefSelect: true,
      emergency: true,
      emptyOk: true,
      // El backend emite la discrepancia de dominio sobre `emergency_contact_dni`
      // (no sobre el teléfono): así el ERROR "no se pudo asignar contacto de
      // emergencia" se enlaza a este selector y salta/cuenta correctamente.
      matchFieldNames: ['related_adults.emergency_contact_dni'],
      note: 'Elige el adulto al que llamar ante una emergencia.',
    },
    // Pestaña "Otro": datos editables de los adultos que no son padre ni madre
    // (el apoderado escaneado por OCR con rol OTHER, tutores, etc.). Tienen su
    // propia pestaña —como Padre/Madre—, y siguen apareciendo como opción en los
    // selectores de apoderado / contacto de emergencia. Si no hay ninguno, se
    // muestra "No registrado" (mismo fallback que Padre/Madre).
    ...(otherAdultIndices.length > 0
      ? otherAdultIndices.flatMap((index, n) => {
          const roleLabel = relationshipLabel(adults[index].relationship);
          return adultFields(index, 'Otro', `otro-${n}`, {
            name: `Nombre (${roleLabel})`,
            dni: `DNI (${roleLabel})`,
            phone: `Teléfono (${roleLabel})`,
          });
        })
      : adultFields(-1, 'Otro', 'otro', {
          name: 'Nombre del adulto',
          dni: 'DNI del adulto',
          phone: 'Teléfono del adulto',
        })),
  ];
}

export type FieldStatus = 'ok' | 'warning' | 'error' | 'empty';

export interface FieldValidation {
  status: FieldStatus;
  /** Mensaje de la discrepancia (regla + valor leído), si la hay. */
  message: string | null;
  discrepancy: TriageDiscrepancy | null;
}

/** Busca la discrepancia asociada a un campo (por field_name o document_code). */
export function matchDiscrepancy(
  field: CorrectionFieldDescriptor,
  discrepancies: TriageDiscrepancy[]
): TriageDiscrepancy | null {
  return (
    discrepancies.find(
      (d) =>
        (field.matchFieldNames?.includes(d.field_name) ?? false) ||
        (d.document_code != null &&
          (field.matchDocCodes?.includes(d.document_code) ?? false))
    ) ?? null
  );
}

/** ¿El valor actual del campo está en blanco? (según su control). */
function isBlank(field: CorrectionFieldDescriptor, value: unknown): boolean {
  if (field.control === 'bool') return value === null || value === undefined;
  if (field.control === 'multi')
    return !Array.isArray(value) || value.length === 0;
  return value == null || value === '';
}

/**
 * Estado de validación de un campo: la discrepancia (backend) manda; si no la
 * hay, se marca "por completar" cuando está vacío sin ser opcional; si no, "ok".
 */
export function deriveFieldValidation(
  field: CorrectionFieldDescriptor,
  value: unknown,
  discrepancies: TriageDiscrepancy[]
): FieldValidation {
  const disc = matchDiscrepancy(field, discrepancies);
  if (disc) {
    let message = disc.rule_description;
    if (disc.actual_value && disc.actual_value !== '(vacío)') {
      message += `  ·  leído: "${disc.actual_value}"`;
    }
    return {
      status: disc.severity === 'ERROR' ? 'error' : 'warning',
      message,
      discrepancy: disc,
    };
  }
  if (field.control === 'readonly') return { status: 'ok', message: null, discrepancy: null };
  if (isBlank(field, value) && !field.emptyOk) {
    return { status: 'empty', message: null, discrepancy: null };
  }
  return { status: 'ok', message: null, discrepancy: null };
}

/** Edad en años a partir de una fecha ISO (YYYY-MM-DD). '' si no hay fecha. */
export function ageFromIso(iso: string, now: Date): string {
  if (!iso) return '';
  const birth = new Date(iso);
  if (Number.isNaN(birth.getTime())) return '';
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 ? String(age) : '';
}
