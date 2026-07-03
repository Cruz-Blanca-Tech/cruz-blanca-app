/**
 * Schema del listado de beneficiarios para la futura tabla del feature
 * `beneficiarios` (GET /api/v1/mdm/beneficiaries/).
 *
 * El backend tipa la respuesta con `PaginatedBeneficiaryResponse`, cuyos `items`
 * son `BeneficiarySummaryResponse` (ver
 * backend-api/.../presentation/schemas/beneficiary_schemas.py). Este schema
 * modela EXACTAMENTE esa forma: no incluye programas, "última actividad",
 * "último registro" ni "perfil completo" del mockup, porque el endpoint NO los
 * devuelve (ver el inventario del gap en la entrega).
 *
 * El schema es la única fuente de verdad y la validación de runtime en la
 * frontera del service; los tipos se derivan con `z.infer`.
 */
import { z } from 'zod';

/** Género tal como lo serializa el backend (enum `Gender`, o `null`). */
const genderSchema = z.enum(['MALE', 'FEMALE', 'OTHER', 'UNKNOWN']).nullable();

/**
 * Beneficiario tal como lo devuelve el listado (`BeneficiarySummaryResponse`).
 * `birth_date` viaja como ISO date string (`YYYY-MM-DD`) o `null`; `age` la
 * calcula el backend a partir de la fecha de nacimiento. `grade` es el grado
 * educativo (solo presente si el beneficiario tiene registro educativo).
 */
export const beneficiarySummarySchema = z.object({
  id: z.string(),
  dni: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  birth_date: z.string().nullable(),
  age: z.number().int().nullable(),
  gender: genderSchema,
  is_active: z.boolean(),
  grade: z.string().nullable(),
});
export type BeneficiarySummary = z.infer<typeof beneficiarySummarySchema>;

/**
 * Respuesta completa del listado (`PaginatedBeneficiaryResponse`). `total` es el
 * conteo GLOBAL (el backend lo resuelve con un `count()` aparte, antes de aplicar
 * `skip`/`limit`), así que sirve para paginar de verdad: nº de páginas =
 * ceil(total / limit). `skip`/`limit` son el eco de los query params recibidos.
 */
export const beneficiariesListSchema = z.object({
  items: z.array(beneficiarySummarySchema),
  total: z.number().int().nonnegative(),
  skip: z.number().int().nonnegative(),
  limit: z.number().int().nonnegative(),
});
export type BeneficiariesList = z.infer<typeof beneficiariesListSchema>;
