'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  beneficiariosService,
  type BeneficiariesListFilters,
} from '../services/beneficiarios-service';

/**
 * Query keys del feature `beneficiarios` (lectura del listado MDM). La data de
 * API es estado de servidor → vive en TanStack Query. La factory sigue el patrón
 * de `triajeKeys`: un prefijo `lists()` que las (futuras) mutaciones podrán usar
 * para invalidar TODAS las variantes paginadas de una sola vez.
 */
export const beneficiariosKeys = {
  all: ['beneficiarios'] as const,
  lists: () => [...beneficiariosKeys.all, 'list'] as const,
  list: (filters: BeneficiariesListFilters) =>
    [...beneficiariosKeys.lists(), filters] as const,
};

const FIVE_MINUTES = 1000 * 60 * 5;

/**
 * GET /beneficiaries/ — listado paginado de beneficiarios para la tabla.
 *
 * Es un maestro de datos (no una cola viva como el triaje), así que NO se fija
 * `refetchInterval`: se revalida al montar/recuperar el foco y basta con un
 * `staleTime` moderado para evitar refetches redundantes al navegar.
 * `keepPreviousData` evita el parpadeo al paginar: mantiene la página anterior
 * visible hasta que llega la nueva.
 */
export function useBeneficiaries(filters?: BeneficiariesListFilters) {
  return useQuery({
    queryKey: beneficiariosKeys.list(filters ?? {}),
    queryFn: () => beneficiariosService.getBeneficiaries(filters),
    placeholderData: keepPreviousData,
    staleTime: FIVE_MINUTES,
  });
}
