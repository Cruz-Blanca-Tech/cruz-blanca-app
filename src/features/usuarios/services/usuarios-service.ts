import { apiClient } from '@/lib/api-client';
import { parseApiResponse } from '@/lib/parse-api-response';
import { API_PATHS } from '@/lib/api-paths';
import type { Role } from '@/features/auth/types';

import {
  userSchema,
  usersListSchema,
  type User,
  type UsersList,
} from '../schemas/user-schema';

/**
 * Servicio del feature `usuarios`. El prefijo (`/auth/users`) sale de
 * `API_PATHS.users`. Las rutas se resuelven contra el proxy (`/api/proxy`), que
 * inyecta el Bearer. Cada respuesta se valida con Zod en la frontera (el
 * genérico del fetch no valida nada en runtime).
 */
export const usuariosService = {
  /**
   * GET /auth/users/ — listado completo de usuarios para la tabla. La búsqueda y
   * el filtro por rol se aplican en el cliente sobre esta lista (el endpoint no
   * pagina ni filtra).
   */
  async getUsers(): Promise<UsersList> {
    const data = await apiClient.get(API_PATHS.users);
    return parseApiResponse(usersListSchema, data, 'el listado de usuarios');
  },

  /**
   * PATCH /auth/users/{userId}/role — cambia el rol de un usuario. Devuelve el
   * usuario ya actualizado, que se valida con el mismo `userSchema`.
   */
  async updateUserRole(userId: string, role: Role): Promise<User> {
    const data = await apiClient.patch(`${API_PATHS.users}/${userId}/role`, { role });
    return parseApiResponse(userSchema, data, 'el usuario');
  },
};
