/**
 * Envoltorio común de TODOS los endpoints de analítica del backend
 * (Reporting & Analytics API). El backend no devuelve el arreglo de datos "a
 * secas", sino un `DashboardResponse<T>` que acompaña la serie con metadatos de
 * presentación, pensados para que cada gráfico se pinte sin hardcodear textos:
 *
 * - `title`: título del gráfico/tarjeta (p. ej. "Volumen diario de casos").
 * - `description`: subtítulo o explicación breve de qué muestra la métrica.
 * - `source`: origen/consulta de los datos (para la nota al pie de auditoría).
 * - `legend`: mapa opcional `clave → etiqueta legible` para traducir los valores
 *   crudos de las series (p. ej. `{ "PENDING": "Pendiente" }`). Es
 *   `nullable().optional()` porque no todas las métricas la emiten (las que no
 *   la necesitan la omiten o mandan `null`); la UI cae a la clave cruda si falta.
 * - `data`: la serie en sí, un arreglo del `data item` propio de cada métrica.
 *
 * Este helper se REUTILIZA para las 5 métricas: cada schema de métrica solo
 * define la forma de su `data item` y lo pasa a `dashboardResponseSchema(...)`,
 * evitando repetir el envoltorio.
 */
import { z } from 'zod';

/**
 * Construye el schema del envoltorio `DashboardResponse<T>` a partir del schema
 * del elemento de la serie (`data[]`). Se usa como fábrica genérica en cada
 * schema de métrica.
 */
export function dashboardResponseSchema<T extends z.ZodTypeAny>(
  dataItemSchema: T
) {
  return z.object({
    title: z.string(),
    description: z.string(),
    source: z.string(),
    legend: z.record(z.string(), z.string()).nullable().optional(),
    data: z.array(dataItemSchema),
  });
}

/**
 * Tipo genérico inferido del envoltorio. `T` es el tipo del `data item`, de modo
 * que `DashboardResponse<DailyVolumeItem>` describe la respuesta completa de esa
 * métrica (metadatos + `data: DailyVolumeItem[]`).
 */
export type DashboardResponse<T> = {
  title: string;
  description: string;
  source: string;
  legend?: Record<string, string> | null;
  data: T[];
};
