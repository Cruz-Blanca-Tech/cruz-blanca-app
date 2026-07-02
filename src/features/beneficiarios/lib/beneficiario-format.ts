import type { BeneficiarySummary } from '../schemas/beneficiaries-list-schema';

/**
 * Helpers de presentación del listado de beneficiarios (nombre, iniciales,
 * enmascarado por rol y etiqueta de género). Son funciones puras sobre datos ya
 * tipados por el schema, así que no necesitan Zod.
 */

/** Nombre completo mostrado en la tabla (`first_name` + `last_name`). */
export function getFullName(
  beneficiary: Pick<BeneficiarySummary, 'first_name' | 'last_name'>
): string {
  return `${beneficiary.first_name} ${beneficiary.last_name}`.trim();
}

/** Iniciales para el avatar (primera letra de nombre y apellido). */
export function getInitials(
  beneficiary: Pick<BeneficiarySummary, 'first_name' | 'last_name'>
): string {
  const first = beneficiary.first_name.trim()[0] ?? '';
  const last = beneficiary.last_name.trim()[0] ?? '';
  return `${first}${last}`.toUpperCase() || '?';
}

/**
 * Enmascara el DNI dejando solo los últimos 4 dígitos (rol Visualizador).
 * Réplica del helper `maskDni` del mockup.
 */
export function maskDni(dni: string): string {
  return dni.slice(-4);
}

/**
 * Enmascara el nombre completo a iniciales (rol Visualizador):
 * "Carlos Andrés Condori" → "C A*** C******" (máx. 4 asteriscos por palabra).
 * Réplica del helper `maskNombre` del mockup.
 */
export function maskName(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      if (index === 0) return word[0].toUpperCase();
      const stars = '*'.repeat(Math.min(Math.max(word.length - 1, 1), 4));
      return word[0].toUpperCase() + stars;
    })
    .join(' ');
}

/** Etiquetas en español del enum `Gender` del backend. */
const GENDER_LABELS: Record<NonNullable<BeneficiarySummary['gender']>, string> = {
  MALE: 'Masculino',
  FEMALE: 'Femenino',
  OTHER: 'Otro',
  UNKNOWN: 'Sin especificar',
};

/** Etiqueta legible del género; `—` cuando el backend no lo entrega. */
export function getGenderLabel(gender: BeneficiarySummary['gender']): string {
  if (!gender) return '—';
  return GENDER_LABELS[gender];
}
