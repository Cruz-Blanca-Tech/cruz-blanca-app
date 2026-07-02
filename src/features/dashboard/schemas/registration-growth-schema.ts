/**
 * Crecimiento de registros (GET /demographics/registration-growth).
 *
 * Serie temporal mensual: cuántos beneficiarios NUEVOS se registraron cada mes.
 * Se visualiza como un gráfico de líneas o de barras con el mes en el eje X y el
 * alta de beneficiarios en el eje Y, para ver la tendencia de crecimiento del
 * padrón.
 *
 * `month` es el período tal como lo emite el backend (string, p. ej. "2026-06");
 * no se parsea a `Date` en la frontera, el formateo queda en presentación.
 */
import { z } from 'zod';
import { dashboardResponseSchema } from './dashboard-response-schema';

const count = z.number().int().nonnegative();

/** Punto de la serie: altas de beneficiarios de un mes concreto. */
export const registrationGrowthItemSchema = z.object({
  month: z.string(),
  new_beneficiaries: count,
});
export type RegistrationGrowthItem = z.infer<
  typeof registrationGrowthItemSchema
>;

/** Respuesta completa del endpoint (envoltorio + serie mensual). */
export const registrationGrowthSchema = dashboardResponseSchema(
  registrationGrowthItemSchema
);
export type RegistrationGrowth = z.infer<typeof registrationGrowthSchema>;
