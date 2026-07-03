/**
 * Schemas del feature `usuarios` (gestión de cuentas y roles).
 *
 * La API expone hoy solo dos operaciones: listar usuarios (`GET /auth/users/`) y
 * cambiar el rol de uno (`PATCH /auth/users/{id}/role`). Este schema modela
 * EXACTAMENTE la forma que devuelve el backend para cada usuario; NO incluye
 * estado activo/inactivo, programas asignados ni último acceso del mockup,
 * porque el endpoint no los expone.
 *
 * El `role` se valida contra el `roleSchema` de auth (única fuente de verdad de
 * los roles del sistema): un valor inesperado debe fallar de forma explícita en
 * la frontera del service, no degradar en silencio la UI de permisos.
 */
import { z } from 'zod';

import { roleSchema } from '@/features/auth/types';

/** Usuario tal como lo devuelve el listado y el PATCH de rol. */
export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: roleSchema,
  full_name: z.string(),
});
export type User = z.infer<typeof userSchema>;

/** Respuesta de `GET /auth/users/`: un array plano de usuarios. */
export const usersListSchema = z.array(userSchema);
export type UsersList = z.infer<typeof usersListSchema>;

/**
 * Schema del formulario "Editar rol": el único campo editable es el `role`, que
 * debe ser uno de los roles válidos. Es la única fuente de validación del form
 * (React Hook Form + zodResolver).
 */
export const updateRoleFormSchema = z.object({
  role: roleSchema,
});
export type UpdateRoleFormValues = z.infer<typeof updateRoleFormSchema>;
