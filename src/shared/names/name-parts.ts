/**
 * HU-004: nombres y apellidos en campos separados.
 *
 * El maestro guarda los apellidos en un solo campo normalizado, en el orden
 * peruano "PATERNO MATERNO", y los adultos del expediente como nombre completo
 * "NOMBRES PATERNO MATERNO". Estas funciones puras convierten entre ese formato
 * y los campos separados que muestra la interfaz (nombres, apellido paterno y
 * apellido materno), respetando apellidos compuestos con partículas
 * ("DE LA CRUZ", "DEL ÁGUILA", "SAN MARTÍN").
 */

/** Partículas que forman parte del apellido o nombre siguiente. */
const PARTICLES = new Set(['DE', 'DEL', 'LA', 'LAS', 'LOS', 'Y', 'SAN', 'SANTA', 'DA', 'DI', 'VAN', 'VON', 'MC', 'MAC']);

const clean = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

/** Agrupa las partículas con la palabra que las sigue: "de la Cruz Pérez" → ["de la Cruz", "Pérez"]. */
export function groupNameUnits(text: string | null | undefined): string[] {
  const tokens = clean(text).split(' ').filter(Boolean);
  const units: string[] = [];
  let pending: string[] = [];
  for (const token of tokens) {
    pending.push(token);
    if (!PARTICLES.has(token.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase())) {
      units.push(pending.join(' '));
      pending = [];
    }
  }
  if (pending.length) units.push(pending.join(' '));
  return units;
}

export interface SurnameParts {
  paternal: string;
  maternal: string;
}

/** "Quispe Flores" → { paternal: "Quispe", maternal: "Flores" }. Un solo apellido va al paterno. */
export function splitSurnames(lastName: string | null | undefined): SurnameParts {
  const units = groupNameUnits(lastName);
  if (units.length === 0) return { paternal: '', maternal: '' };
  return { paternal: units[0], maternal: units.slice(1).join(' ') };
}

/** Une apellido paterno y materno en el formato del maestro ("PATERNO MATERNO"). */
export function composeSurnames(paternal: string, maternal: string): string {
  return [clean(paternal), clean(maternal)].filter(Boolean).join(' ');
}

export interface FullNameParts extends SurnameParts {
  givenNames: string;
}

/**
 * "Juan Carlos Quispe Mamani" → nombres "Juan Carlos", paterno "Quispe", materno "Mamani".
 * Con dos palabras se asume nombre + apellido paterno; con una, solo nombre.
 */
export function splitFullName(fullName: string | null | undefined): FullNameParts {
  const units = groupNameUnits(fullName);
  if (units.length === 0) return { givenNames: '', paternal: '', maternal: '' };
  if (units.length === 1) return { givenNames: units[0], paternal: '', maternal: '' };
  if (units.length === 2) return { givenNames: units[0], paternal: units[1], maternal: '' };
  return {
    givenNames: units.slice(0, -2).join(' '),
    paternal: units[units.length - 2],
    maternal: units[units.length - 1],
  };
}

/** Une nombres y apellidos en el formato de nombre completo del expediente. */
export function composeFullName(givenNames: string, paternal: string, maternal: string): string {
  return [clean(givenNames), clean(paternal), clean(maternal)].filter(Boolean).join(' ');
}

/** ¿El nombre completo trae al menos un nombre y un apellido? */
export function hasGivenNameAndSurname(fullName: string | null | undefined): boolean {
  return groupNameUnits(fullName).length >= 2;
}
