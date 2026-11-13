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

/** Datos del expediente que sirven de ancla para separar el nombre de un adulto (D17). */
export interface AdultNameAnchor {
  /** Apellidos del menor beneficiario ("PATERNO MATERNO"). */
  childLastName?: string | null;
  /** Parentesco padre/madre (FATHER/MOTHER), no el rol de apoderado o contacto. */
  isParent?: boolean;
}

/** Clave de comparación exacta de una unidad de apellido: sin tildes y en mayúsculas. */
const unitKey = (unit: string) =>
  clean(unit.normalize('NFD').replace(/[̀-ͯ]/g, '')).toUpperCase();

/**
 * D17 (misma regla B2 que el backend, `educa_dossier_mapper.py`): con 3 o más
 * unidades, decide entre 1 y 2 apellidos anclando en los apellidos del menor.
 * Coincidencia exacta por unidad; máximo 2 unidades de apellido y al menos 1 de
 * nombre. La penúltima unidad vale para cualquier adulto; la última, solo para
 * padre/madre. Devuelve null si no hay ancla (se usa la regla de respaldo).
 */
function anchorOnChildSurnames(units: string[], anchor: AdultNameAnchor | undefined): FullNameParts | null {
  if (units.length < 3 || !anchor || typeof anchor.childLastName !== 'string') return null;
  const childKeys = new Set(groupNameUnits(anchor.childLastName).map(unitKey).filter(Boolean));
  if (childKeys.size === 0) return null;
  const candidates = [units.length - 2, ...(anchor.isParent ? [units.length - 1] : [])];
  for (const i of candidates) {
    if (childKeys.has(unitKey(units[i]))) {
      return { givenNames: units.slice(0, i).join(' '), paternal: units[i], maternal: units.slice(i + 1).join(' ') };
    }
  }
  return null;
}

/**
 * "Juan Carlos Quispe Mamani" → nombres "Juan Carlos", paterno "Quispe", materno "Mamani".
 * Con dos palabras se asume nombre + apellido paterno; con una, solo nombre.
 * Con `anchor` (apellidos del menor y parentesco), el reparto ambiguo de 3
 * unidades se resuelve igual que al guardar en el maestro (D17).
 */
export function splitFullName(fullName: string | null | undefined, anchor?: AdultNameAnchor): FullNameParts {
  const units = groupNameUnits(fullName);
  const anchored = anchorOnChildSurnames(units, anchor);
  if (anchored) return anchored;
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
