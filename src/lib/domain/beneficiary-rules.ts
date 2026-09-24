/**
 * Reglas de dominio del beneficiario (MDM).
 *
 * Esta es la ÚNICA fuente de verdad para las reglas de negocio que aplican
 * a un beneficiario, independientemente del canal de entrada:
 *   - OCR / Triaje  →  dossier_data PATCH
 *   - Formulario directo  →  POST / PATCH beneficiarios
 *
 * Las funciones son puras (sin dependencias de React ni de features).
 */

/** DNI peruano válido: exactamente 8 dígitos numéricos. */
export const BENEFICIARY_DNI_REGEX = /^\d{8}$/;

/** Máximo de adultos relacionados permitidos por beneficiario. */
export const BENEFICIARY_MAX_ADULTS = 3;

/**
 * Edad máxima (exclusiva) para ser considerado beneficiario menor de edad.
 * Un beneficiario con exactamente 18 años cumplidos NO es menor.
 */
export const BENEFICIARY_MAX_AGE = 18;

/**
 * Roles/relaciones de parentesco exclusivos: solo puede existir uno de cada
 * uno por beneficiario. Aplica tanto al campo `relationship` (triaje/OCR) como
 * al campo `role` (formulario de beneficiarios).
 */
export const EXCLUSIVE_RELATIONSHIPS = ['FATHER', 'MOTHER'] as const;
export type ExclusiveRelationship = (typeof EXCLUSIVE_RELATIONSHIPS)[number];

// ---------------------------------------------------------------------------
// Funciones de validación
// ---------------------------------------------------------------------------

/**
 * ¿El DNI cumple el formato peruano (8 dígitos numéricos)?
 * Recibe el valor ya recortado (trim).
 */
export function isValidDni(dni: string): boolean {
  return BENEFICIARY_DNI_REGEX.test(dni.trim());
}

/**
 * ¿La fecha de nacimiento corresponde a un menor de edad?
 *
 * @returns
 *   - `null`  — fecha vacía o inválida (no se puede evaluar).
 *   - `true`  — es menor (< 18 años cumplidos).
 *   - `false` — es mayor o igual a 18 años.
 */
export function isBeneficiaryMinor(
  birthDate: string | null | undefined
): boolean | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age -= 1;
  }
  return age < BENEFICIARY_MAX_AGE;
}

/**
 * ¿El rol/parentesco es exclusivo (máximo 1 por beneficiario)?
 * Acepta tanto valores de `relationship` (triaje) como `role` (beneficiarios).
 */
export function isExclusiveRelationship(role: string): boolean {
  return (EXCLUSIVE_RELATIONSHIPS as readonly string[]).includes(role);
}

/**
 * ¿Hay otro adulto (distinto a `currentIndex`) con el mismo rol exclusivo
 * en el array? Acepta tanto el campo `relationship` (triaje/OCR) como `role`
 * (formulario de beneficiarios).
 */
export function hasConflictingExclusiveRole(
  adults: Array<{ role?: string; relationship?: string }>,
  currentIndex: number,
  role: string
): boolean {
  if (!isExclusiveRelationship(role)) return false;
  return adults.some((a, i) => {
    if (i === currentIndex) return false;
    return (a.relationship ?? a.role) === role;
  });
}

/**
 * Valida el DNI de un adulto contra todas las reglas del MDM.
 * Devuelve el mensaje de error (string) o `null` si es válido.
 *
 * @param dni            - Valor del DNI (puede venir sin trim).
 * @param currentIndex   - Índice del adulto actual en el array.
 * @param beneficiaryDni - DNI del beneficiario (ya recortado).
 * @param adults         - Array completo de adultos del form.
 * @param isGuardian     - Si el adulto actual es el apoderado designado.
 */
export function validateAdultDni(
  dni: string | undefined | null,
  currentIndex: number,
  beneficiaryDni: string,
  adults: Array<{ dni?: string | null }>,
  isGuardian = false
): string | null {
  const trimmed = (dni ?? '').trim();

  if (!trimmed) {
    return isGuardian
      ? 'El apoderado debe tener DNI obligatorio.'
      : 'El DNI es obligatorio para registrar al familiar.';
  }

  if (!isValidDni(trimmed)) {
    return 'El DNI debe tener exactamente 8 dígitos numéricos.';
  }

  if (beneficiaryDni && trimmed === beneficiaryDni) {
    return 'Coincide con el DNI del beneficiario.';
  }

  const isDuplicate = adults.some(
    (other, idx) => idx !== currentIndex && (other.dni ?? '').trim() === trimmed
  );
  if (isDuplicate) {
    return 'DNI duplicado con otro familiar.';
  }

  return null;
}

/**
 * Valida la lista completa de adultos para el submit (ambos canales).
 * Devuelve el primer mensaje de error encontrado, o `null` si todo es válido.
 *
 * @param adults         - Array de adultos (nombre y DNI).
 * @param beneficiaryDni - DNI del beneficiario ya validado.
 */
export function validateAdultsOnSubmit(
  adults: Array<{
    dni?: string | null;
    full_name?: string | null;
    /** Campo alternativo de nombre (formulario de beneficiarios usa first_name/last_name). */
    first_name?: string | null;
    last_name?: string | null;
    relationship?: string;
    role?: string;
  }>,
  beneficiaryDni: string
): string | null {
  const seenDnis = new Map<string, string>();

  for (let i = 0; i < adults.length; i++) {
    const adult = adults[i];
    const adDni = (adult.dni ?? '').trim();
    const adName = (
      adult.full_name ??
      [adult.first_name, adult.last_name].filter(Boolean).join(' ')
    ).trim();
    const rel = adult.relationship ?? adult.role ?? '';
    const label =
      adName ||
      (rel === 'FATHER' ? 'Padre' : rel === 'MOTHER' ? 'Madre' : `Familiar ${i + 1}`);

    if (!adDni) {
      return `El familiar '${label}' debe tener un DNI obligatorio de 8 dígitos. Si no corresponde registrarlo, elimínelo de la lista.`;
    }

    if (!isValidDni(adDni)) {
      return `El DNI "${adDni}" de '${label}' debe tener exactamente 8 dígitos numéricos.`;
    }

    if (!adName) {
      return `El familiar con DNI ${adDni} debe tener nombre completo.`;
    }

    if (beneficiaryDni && adDni === beneficiaryDni) {
      return `El DNI ${adDni} de '${label}' coincide con el DNI del beneficiario.`;
    }

    if (seenDnis.has(adDni)) {
      const prev = seenDnis.get(adDni);
      return `El DNI ${adDni} está repetido entre '${prev}' y '${label}'. Cada persona debe tener un DNI único.`;
    }

    seenDnis.set(adDni, label);
  }

  return null;
}
