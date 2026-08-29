/**
 * Iniciales para un avatar a partir de un nombre completo: toma las dos primeras
 * palabras no vacías y devuelve sus iniciales en mayúscula (p. ej.
 * "Carmen Rosa Huamán" → "CR"). Si el nombre está vacío, cae a "?" para que el
 * avatar nunca quede en blanco.
 *
 * Home canónico de esta lógica, antes duplicada en `layout/topbar` y en
 * `usuarios/lib/user-format`. NOTA: `beneficiarios` usa una variante distinta
 * (inicial de nombre + inicial de apellido desde campos separados), que NO es
 * equivalente para nombres compuestos y por eso se mantiene aparte.
 */
export function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
  return initials || '?';
}
