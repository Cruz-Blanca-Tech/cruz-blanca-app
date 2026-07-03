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
  /**
   * Código(s) del documento FUENTE que el visor debe mostrar al enfocar este
   * campo, en orden de preferencia (gana el primero que exista en el expediente).
   * Es un mapeo ESTABLE campo→documento, independiente de que haya o no una
   * discrepancia. Se distingue a propósito de `matchDocCodes` (que empareja el
   * campo con una discrepancia): el `document_code` de una discrepancia apunta al
   * documento donde se DETECTÓ el conflicto (p. ej. la ficha FINS), no al
   * documento que hay que revisar para corregir el campo. Sin esto, el visor
   * saltaría a ese documento de detección (a menudo el primero) en vez del DNI.
   */
  viewerDocCodes?: string[];
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
      dniMatchFieldNames?: string[];
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
        // El expediente solo trae un documento de DNI de adulto (DNIAP, el del
        // apoderado). Padre, madre y demás adultos comparten ese documento fuente.
        viewerDocCodes: ['DNIAP', 'DNI'],
        // `field_name` friendly del formato de DNI escaneado en FINS (`DNI Padre`,
        // `DNI Madre`). No es una ruta de campo, por eso es explícito.
        matchFieldNames: extra?.dniMatchFieldNames,
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
      // `beneficiary.name` (DOMINIO) valida nombre Y apellido juntos: no existe un
      // campo con esa ruta, así que la observación se ancla aquí (Nombres).
      matchFieldNames: ['beneficiary.name'],
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
      // El error DOMINIO `beneficiary.dni` lo cubre el fallback por `name`.
      // Aquí solo los `field_name` friendly del OCR (formato del DNI del niño en
      // FINS/DJ) y el id sintético del crosscheck. `Número de Documento` NO se
      // lista: es el mismo literal para DNIBE y DNIAP → se empareja por
      // `document_code` (DNIBE) para no capturar el DNI del apoderado (DNIAP).
      matchFieldNames: ['DNI del Niño/a', 'DNI Niño', 'beneficiary_dni_crosscheck'],
      matchDocCodes: ['DNIBE'],
      viewerDocCodes: ['DNIBE', 'DNI'],
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
    ...adultFields(
      father,
      'Padre',
      'padre',
      {
        name: 'Nombre del padre',
        dni: 'DNI del padre',
        phone: 'Teléfono del padre',
      },
      { dniMatchFieldNames: ['DNI Padre'] }
    ),
    ...adultFields(
      mother,
      'Madre',
      'madre',
      {
        name: 'Nombre de la madre',
        dni: 'DNI de la madre',
        phone: 'Teléfono de la madre',
      },
      { dniMatchFieldNames: ['DNI Madre'] }
    ),
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
      // El backend NUNCA emite `related_adults.guardian_dni` (era un typo muerto).
      // Emite la presencia/nombre del apoderado y los crosscheck de su DNI; ninguno
      // es una ruta de campo, por eso van explícitos aquí.
      matchFieldNames: [
        'related_adults.guardian',
        'related_adults.guardian_name',
        'guardian_dni_crosscheck_exact',
        'guardian_dni_crosscheck_fins',
      ],
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
    //
    // PENDIENTE (C.1) — HUÉRFANO CONSCIENTE: el formato del DNI del apoderado se
    // emite con `field_name` friendly compartido ("DNI Apoderado" en FINS/DJ y
    // "Número de Documento" en DNIAP), sin señalar A QUÉ adulto pertenece. Como el
    // apoderado es un ROL dinámico (índice de adulto, no un campo fijo), hoy esa
    // discrepancia queda sin descriptor a propósito (no la mapeamos a la fuerza
    // para no capturarla en el campo equivocado). Arreglo correcto en el BACKEND:
    // que la discrepancia emita el índice del adulto (p. ej. `related_adults.
    // adults[i].dni`) para poder anclarla al `otro-N.dni` correspondiente.
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

/**
 * Normaliza un identificador para compararlo sin ruido de acentos, mayúsculas ni
 * espacios sobrantes. Es una RED DE SEGURIDAD ante deriva del backend: hoy los
 * literales coinciden exactos, pero así un `Género`/`genero` o un espacio extra
 * no rompen el emparejamiento en silencio (el match sigue siendo por igualdad,
 * solo que sobre la forma normalizada de AMBOS lados).
 */
function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Busca la discrepancia asociada a un campo. El emparejamiento es, en orden:
 *  1. Fallback estructural: el `field_name` del backend coincide con la ruta RHF
 *     (`name`) o el `id` del descriptor. Las reglas de DOMINIO emiten dot-paths
 *     (`beneficiary.dni`, `education.grade`, …) que YA son esos identificadores,
 *     así que no hace falta declararlos en `matchFieldNames`: se derivan (evita
 *     duplicar la lista de campos).
 *  2. `matchFieldNames`: solo para `field_name` que NO son una ruta de campo —
 *     nombres "friendly" del OCR (`DNI Padre`, `DNI del Niño/a`) o ids sintéticos
 *     de crosscheck / dominio compuesto (`beneficiary_dni_crosscheck`,
 *     `beneficiary.name`, `related_adults.guardian`).
 *  3. `matchDocCodes`: por `document_code` del documento (p. ej. `DNIBE`).
 * Todo se compara sobre la forma normalizada (acentos/mayúsculas/espacios).
 */
export function matchDiscrepancy(
  field: CorrectionFieldDescriptor,
  discrepancies: TriageDiscrepancy[]
): TriageDiscrepancy | null {
  const selfKeys = [field.name, field.id]
    .filter((k): k is string => k != null)
    .map(normalizeKey);
  const fieldNameKeys = (field.matchFieldNames ?? []).map(normalizeKey);
  const docCodeKeys = (field.matchDocCodes ?? []).map(normalizeKey);
  return (
    discrepancies.find((d) => {
      const nameKey = normalizeKey(d.field_name);
      if (selfKeys.includes(nameKey) || fieldNameKeys.includes(nameKey)) {
        return true;
      }
      return (
        d.document_code != null &&
        docCodeKeys.includes(normalizeKey(d.document_code))
      );
    }) ?? null
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
