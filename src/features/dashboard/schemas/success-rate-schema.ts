/**
 * Tasa de éxito del procesamiento (GET /operations/success-rate).
 *
 * Distribución de casos por estado final del pipeline: cuántos casos hay en cada
 * `status` (p. ej. procesado con éxito, con error, pendiente). Se visualiza como
 * un gráfico de dona/torta o de barras apiladas para leer de un vistazo qué
 * proporción del total terminó correctamente frente a los estados de fallo.
 *
 * `status` es la clave cruda del estado del backend; la etiqueta legible para la
 * leyenda viene en `legend` del envoltorio (ver `dashboard-response-schema.ts`).
 */
import { z } from 'zod';
import { dashboardResponseSchema } from './dashboard-response-schema';

const count = z.number().int().nonnegative();

/** Segmento de la distribución: cantidad de casos en un estado dado. */
export const successRateItemSchema = z.object({
  status: z.string(),
  count,
});
export type SuccessRateItem = z.infer<typeof successRateItemSchema>;

/** Respuesta completa del endpoint (envoltorio + distribución por estado). */
export const successRateSchema = dashboardResponseSchema(successRateItemSchema);
export type SuccessRate = z.infer<typeof successRateSchema>;
