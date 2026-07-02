/**
 * Iniciales de un usuario a partir de su nombre completo: toma las dos primeras
 * palabras no vacías y las devuelve en mayúscula (p. ej. "Carmen Rosa Huamán" →
 * "CR"). Si el nombre está vacío, cae a "?" para que el avatar nunca quede en
 * blanco.
 */
export function getInitials(fullName: string): string {
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
  return initials || '?';
}
