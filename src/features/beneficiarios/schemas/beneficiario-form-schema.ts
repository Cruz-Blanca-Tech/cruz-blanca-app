import { z } from 'zod';

/** Género tal como lo serializa el backend (enum `Gender`, o `null`). */
export const genderEnum = z.enum(['MALE', 'FEMALE', 'OTHER', 'UNKNOWN']).nullable();

/**
 * Schema base para la creación/edición de beneficiarios.
 *
 * Reglas de dominio (espejo del MDM — ver `src/lib/domain/beneficiary-rules.ts`):
 * - DNI: exactamente 8 dígitos numéricos.
 * - Nombres obligatorios.
 * - Máximo 3 adultos relacionados.
 * - `guardian_ref`: índice (string) del adulto apoderado, obligatorio.
 * - `emergency_contact_ref`: índice (string) del contacto de emergencia, opcional.
 *   Ambos son índices estables al array de adultos (no DNIs) para sobrevivir
 *   ediciones, igual que en el canal OCR/triaje.
 */
export const beneficiarioFormSchema = z.object({
  dni: z
    .string()
    .min(8, 'El documento debe tener exactamente 8 dígitos')
    .max(8, 'El documento debe tener exactamente 8 dígitos')
    .regex(/^\d{8}$/, 'El DNI debe tener exactamente 8 dígitos numéricos'),
  first_name: z.string().min(1, 'El nombre es obligatorio').trim(),
  last_name: z.string().min(1, 'Los apellidos son obligatorios').trim(),
  birth_date: z.string().min(1, 'La fecha de nacimiento es obligatoria'), // YYYY-MM-DD
  gender: genderEnum.optional(),
  address: z.string().nullable().optional(),
  baptized: z.boolean().nullable().optional(),
  first_communion: z.boolean().nullable().optional(),
  haircut_permission: z.boolean().nullable().optional(),
  medical_exams_permission: z.boolean().nullable().optional(),

  medical: z.object({
    has_been_hospitalized: z.boolean().default(false),
    hospitalization_reason: z.string().nullable().optional(),
    has_been_operated: z.boolean().default(false),
    operation_reason: z.string().nullable().optional(),
    vaccines: z.array(z.string()).default([]),
    medications: z.array(z.string()).default([]),
    allergies: z.array(z.string()).default([]),
    diseases: z.array(z.string()).default([]),
    insurance: z.array(z.string()).default([]),
  }).optional(),

  education: z.object({
    school: z.string().nullable().optional(),
    grade: z.string().nullable().optional(),
    knows_how_to_read: z.boolean().nullable().optional(),
    knows_how_to_write: z.boolean().nullable().optional(),
    has_repeated_grade: z.boolean().nullable().optional(),
    has_learning_difficulties: z.boolean().nullable().optional(),
  }).optional(),

  related_adults: z.array(
    z.object({
      id: z.string().optional(),
      dni: z.string().optional(),
      first_name: z.string().min(1, 'Obligatorio'),
      last_name: z.string().min(1, 'Obligatorio'),
      birth_date: z.string().nullable().optional(),
      gender: genderEnum.optional(),
      role: z.string().default('OTHER'),
      phone: z.string().nullable().optional(),
    })
  ).max(3, 'Máximo 3 adultos relacionados').optional(),

  /**
   * Índice (como string) del adulto designado como apoderado dentro de
   * `related_adults`, o '' si ninguno. El apoderado es el responsable principal
   * de cara a la organización (firma documentos, etc.) y es ortogonal al
   * parentesco del adulto (un padre puede ser apoderado, pero también puede
   * serlo un abuelo o cualquier otro adulto de la lista).
   */
  guardian_ref: z.string(),

  /**
   * Índice (como string) del adulto designado como contacto de emergencia, o ''.
   * Exclusivo: solo puede haber uno.
   */
  emergency_contact_ref: z.string(),
});

export type BeneficiarioFormData = z.infer<typeof beneficiarioFormSchema>;
