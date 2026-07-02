/**
 * Pirámide poblacional (GET /demographics/population-pyramid).
 *
 * Distribución de beneficiarios por grupo etario y sexo: por cada `age_group`,
 * el conteo de hombres (`male`) y mujeres (`female`). Se visualiza como una
 * pirámide poblacional (barras horizontales divergentes: un sexo hacia la
 * izquierda y el otro hacia la derecha, un grupo etario por fila).
 *
 * `age_group` es la etiqueta cruda del rango de edad del backend (p. ej.
 * "0-9", "10-19"); el orden lo define el backend y se respeta tal cual llega.
 */
import { z } from 'zod';
import { dashboardResponseSchema } from './dashboard-response-schema';

const count = z.number().int().nonnegative();

/** Fila de la pirámide: conteos por sexo de un grupo etario. */
export const populationPyramidItemSchema = z.object({
  age_group: z.string(),
  male: count,
  female: count,
});
export type PopulationPyramidItem = z.infer<typeof populationPyramidItemSchema>;

/** Respuesta completa del endpoint (envoltorio + filas por grupo etario). */
export const populationPyramidSchema = dashboardResponseSchema(
  populationPyramidItemSchema
);
export type PopulationPyramid = z.infer<typeof populationPyramidSchema>;
