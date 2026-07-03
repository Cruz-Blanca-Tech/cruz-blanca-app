/**
 * Volumen diario de casos (GET /operations/daily-volume).
 *
 * Serie temporal: un punto por día con el total de casos ingresados ese día. Se
 * visualiza como un gráfico de líneas (o de barras) con el día en el eje X y el
 * conteo en el eje Y, para ver la evolución de la carga operativa en el tiempo.
 *
 * `day` es la fecha del punto tal como la emite el backend (string ISO, p. ej.
 * "2026-07-01"); no se parsea a `Date` en la frontera para no perder el formato
 * original y dejar el formateo a la capa de presentación.
 */
import { z } from 'zod';
import { dashboardResponseSchema } from './dashboard-response-schema';

const count = z.number().int().nonnegative();

/** Punto de la serie: total de casos de un día concreto. */
export const dailyVolumeItemSchema = z.object({
  day: z.string(),
  total_cases: count,
});
export type DailyVolumeItem = z.infer<typeof dailyVolumeItemSchema>;

/** Respuesta completa del endpoint (envoltorio + serie diaria). */
export const dailyVolumeSchema = dashboardResponseSchema(dailyVolumeItemSchema);
export type DailyVolume = z.infer<typeof dailyVolumeSchema>;
