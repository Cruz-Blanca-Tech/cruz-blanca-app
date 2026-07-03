/**
 * Discrepancia detectada en un expediente de triaje (regla de calidad incumplida
 * sobre un campo). Es la forma que el backend tipa con `DiscrepancySchema`
 * (data_quality_triage: common_schemas.py) y que se repite en varios responses:
 * el listado de casos del lote (`TriageCaseListItem.discrepancies`) y el
 * expediente EDUCA de corrección (`EducaTriageCase*.discrepancies`).
 *
 * Vive en su propio archivo porque lo consumen varios schemas del feature; no
 * lo dupliques, impórtalo desde aquí.
 *
 * `severity` llega como string plano (`.value` del enum del backend); se tipa
 * como `z.string()` para no romper ante un valor nuevo.
 */
import { z } from 'zod';

export const triageDiscrepancySchema = z.object({
  field_name: z.string(),
  expected_pattern: z.string().nullable(),
  actual_value: z.string().nullable(),
  rule_description: z.string(),
  severity: z.string(),
  document_code: z.string().nullable(),
});
export type TriageDiscrepancy = z.infer<typeof triageDiscrepancySchema>;
