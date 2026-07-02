'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Role } from '@/features/auth/types';

import { usuariosService } from '../services/usuarios-service';

/**
 * Query keys del feature `usuarios`. La data de API es estado de servidor → vive
 * en TanStack Query. Se expone `list()` como prefijo para que la mutación
 * invalide el listado tras un cambio de rol.
 */
export const usuariosKeys = {
  all: ['usuarios'] as const,
  list: () => [...usuariosKeys.all, 'list'] as const,
};

const FIVE_MINUTES = 1000 * 60 * 5;

/**
 * GET /auth/users/ — listado completo de usuarios para la tabla. El listado es
 * estable (no es una cola viva como el triaje), así que se cachea 5 min sin
 * `refetchInterval`; se revalida al montar/recuperar el foco y tras cambiar un
 * rol.
 */
export function useUsers() {
  return useQuery({
    queryKey: usuariosKeys.list(),
    queryFn: usuariosService.getUsers,
    staleTime: FIVE_MINUTES,
  });
}

/**
 * PATCH /auth/users/{userId}/role — cambia el rol de un usuario. Al tener éxito
 * invalida el listado para que la tabla y los contadores del encabezado reflejen
 * el nuevo rol.
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      usuariosService.updateUserRole(userId, role),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: usuariosKeys.list() }),
  });
}
