'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  triajeBatchesService,
  type BatchesSummaryFilters,
  type BatchesListFilters,
} from '../services/batches-service';

/**
 * Query keys del feature `triaje` (lecturas de batches: summary, statuses,
 * listado). La data de API es estado de servidor → vive en TanStack Query.
 */
export const triajeKeys = {
  all: ['triaje'] as const,
  summary: (filters: BatchesSummaryFilters) =>
    ['triaje', 'summary', filters] as const,
  statuses: ['triaje', 'statuses'] as const,
  list: (filters: BatchesListFilters) => ['triaje', 'batches', filters] as const,
};

const FIVE_MINUTES = 1000 * 60 * 5;
const THIRTY_SECONDS = 1000 * 30;

/**
 * GET /batches/summary — totales por estado para las cards. Se refresca cada
 * 30 s (como la tabla) para que los KPIs reflejen la cola en vivo; el
 * `refetchInterval` dispara aunque la data esté "fresca", así que `staleTime`
 * solo evita refetches extra al remontar o recuperar el foco entre intervalos.
 */
export function useBatchesSummary(filters?: BatchesSummaryFilters) {
  return useQuery({
    queryKey: triajeKeys.summary(filters ?? {}),
    queryFn: () => triajeBatchesService.getBatchesSummary(filters),
    staleTime: FIVE_MINUTES,
    refetchInterval: THIRTY_SECONDS,
  });
}

/** GET /batches/statuses con cache — estados disponibles para el select. */
export function useBatchStatuses() {
  return useQuery({
    queryKey: triajeKeys.statuses,
    queryFn: triajeBatchesService.getBatchStatuses,
    staleTime: FIVE_MINUTES,
  });
}

/**
 * GET /batches/ — listado de lotes para la tabla. Es una cola de triaje viva,
 * así que NO se fija `staleTime` (se considera siempre stale: refetch al montar
 * y al recuperar el foco). `keepPreviousData` evita el parpadeo al paginar o
 * cambiar filtros: mantiene la página anterior visible hasta que llega la nueva.
 * Es una bandeja viva → `refetchInterval` de 30 s mantiene la cola al día sin
 * intervención (la UI lo anuncia en el footer).
 */
export function useBatches(filters?: BatchesListFilters) {
  return useQuery({
    queryKey: triajeKeys.list(filters ?? {}),
    queryFn: () => triajeBatchesService.getBatches(filters),
    placeholderData: keepPreviousData,
    refetchInterval: THIRTY_SECONDS,
  });
}
