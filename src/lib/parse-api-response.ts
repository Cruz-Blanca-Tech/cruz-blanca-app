import type { z } from 'zod';

/**
 * Valida una respuesta del backend contra su schema Zod en la frontera del
 * service. Si la forma no coincide, falla de forma explícita y localizada
 * (con un mensaje legible) en vez de dejar que un `undefined` inesperado se
 * propague silenciosamente por la UI.
 *
 * @param label Nombre del recurso para el mensaje de error (p. ej. "programas").
 */
export function parseApiResponse<T>(
  schema: z.ZodType<T>,
  data: unknown,
  label: string
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`La respuesta de ${label} no tiene el formato esperado.`);
  }
  return result.data;
}
