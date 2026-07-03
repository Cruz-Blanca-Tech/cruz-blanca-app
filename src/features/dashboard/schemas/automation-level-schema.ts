/**
 * Nivel de automatización del triaje (GET /operations/automation-level).
 *
 * Distribución de casos por veredicto de triaje (`verdict`): cuántos se
 * resolvieron de forma automática frente a los que requirieron intervención
 * manual. Mide cuánto trabajo está absorbiendo la automatización. Se visualiza
 * como un gráfico de dona/torta o de barras, con el conteo por veredicto.
 *
 * `verdict` es la clave cruda del veredicto del backend; su etiqueta legible
 * viene en `legend` del envoltorio (ver `dashboard-response-schema.ts`).
 */
import { z } from 'zod';
import { dashboardResponseSchema } from './dashboard-response-schema';

const count = z.number().int().nonnegative();

/** Segmento de la distribución: cantidad de casos con un veredicto dado. */
export const automationLevelItemSchema = z.object({
  verdict: z.string(),
  count,
});
export type AutomationLevelItem = z.infer<typeof automationLevelItemSchema>;

/** Respuesta completa del endpoint (envoltorio + distribución por veredicto). */
export const automationLevelSchema = dashboardResponseSchema(
  automationLevelItemSchema
);
export type AutomationLevel = z.infer<typeof automationLevelSchema>;
