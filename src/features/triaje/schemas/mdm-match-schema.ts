/**
 * Match del DNI contra el dato máster (MDM) para la pantalla de corrección de
 * triaje.
 *
 * GET /api/v1/mdm/beneficiaries/by-dni/{dni} →
 *   { exists: true,  beneficiary: MdmBeneficiarySnapshot }  (ya registrado)
 *   { exists: false, beneficiary: null }                    (beneficiario nuevo)
 *
 * El snapshot es LIGERO a propósito: identidad + familiares del maestro. Cuando
 * `exists=true`, la UI rellena con ESTOS valores los campos protegidos del
 * formulario (identidad y padre/madre son del maestro: la verdad) y bloquea su
 * edición — el expediente solo actualizará datos operativos al aprobarse.
 */
import { z } from 'zod';

/** Familiar (adulto) del beneficiario según el maestro. */
export const mdmRelativeSchema = z.object({
  relationship: z.string(),
  dni: z.string(),
  full_name: z.string(),
  phone: z.string().nullish(),
  is_emergency_contact: z.boolean(),
  is_guardian: z.boolean(),
});
export type MdmRelative = z.infer<typeof mdmRelativeSchema>;

/** Snapshot de identidad + familiares de un beneficiario YA registrado. */
export const mdmBeneficiarySchema = z.object({
  dni: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  birth_date: z.string().nullish(),
  gender: z.string().nullish(),
  address: z.string().nullish(),
  relatives: z.array(mdmRelativeSchema).nullish().transform((v) => v || []),
});
export type MdmBeneficiary = z.infer<typeof mdmBeneficiarySchema>;

/** Respuesta del endpoint by-dni. */
export const mdmBeneficiaryMatchSchema = z.object({
  exists: z.boolean(),
  beneficiary: mdmBeneficiarySchema.nullish(),
});
export type MdmBeneficiaryMatch = z.infer<typeof mdmBeneficiaryMatchSchema>;