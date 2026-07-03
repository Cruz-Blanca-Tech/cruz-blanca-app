'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard-service';

/**
 * Query keys del feature `dashboard` (métricas de analítica de la Reporting &
 * Analytics API). La data de API es estado de servidor → vive en TanStack Query.
 * Cada métrica es una hoja bajo `['dashboard']`; no llevan filtros (los endpoints
 * son GET sin parámetros), así que las hojas son claves estáticas.
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  dailyVolume: () => [...dashboardKeys.all, 'daily-volume'] as const,
  successRate: () => [...dashboardKeys.all, 'success-rate'] as const,
  automationLevel: () => [...dashboardKeys.all, 'automation-level'] as const,
  registrationGrowth: () => [...dashboardKeys.all, 'registration-growth'] as const,
  populationPyramid: () => [...dashboardKeys.all, 'population-pyramid'] as const,
};

const FIVE_MINUTES = 1000 * 60 * 5;

/**
 * GET /operations/daily-volume — volumen diario de casos. Es analítica (no una
 * cola viva), así que se cachea con `staleTime` de 5 min y SIN `refetchInterval`:
 * no necesita refrescarse en tiempo real, solo revalidar al montar/recuperar el
 * foco pasados los 5 minutos.
 */
export function useDailyVolume() {
  return useQuery({
    queryKey: dashboardKeys.dailyVolume(),
    queryFn: dashboardService.getDailyVolume,
    staleTime: FIVE_MINUTES,
  });
}

/**
 * GET /operations/success-rate — distribución de casos por estado final (tasa de
 * éxito). Analítica: `staleTime` de 5 min y SIN `refetchInterval`.
 */
export function useSuccessRate() {
  return useQuery({
    queryKey: dashboardKeys.successRate(),
    queryFn: dashboardService.getSuccessRate,
    staleTime: FIVE_MINUTES,
  });
}

/**
 * GET /operations/automation-level — distribución de casos por veredicto de
 * triaje (nivel de automatización). Analítica: `staleTime` de 5 min y SIN
 * `refetchInterval`.
 */
export function useAutomationLevel() {
  return useQuery({
    queryKey: dashboardKeys.automationLevel(),
    queryFn: dashboardService.getAutomationLevel,
    staleTime: FIVE_MINUTES,
  });
}

/**
 * GET /demographics/registration-growth — altas de beneficiarios nuevos por mes
 * (crecimiento del padrón). Analítica: `staleTime` de 5 min y SIN
 * `refetchInterval`.
 */
export function useRegistrationGrowth() {
  return useQuery({
    queryKey: dashboardKeys.registrationGrowth(),
    queryFn: dashboardService.getRegistrationGrowth,
    staleTime: FIVE_MINUTES,
  });
}

/**
 * GET /demographics/population-pyramid — distribución de beneficiarios por grupo
 * etario y sexo (pirámide poblacional). Analítica: `staleTime` de 5 min y SIN
 * `refetchInterval`.
 */
export function usePopulationPyramid() {
  return useQuery({
    queryKey: dashboardKeys.populationPyramid(),
    queryFn: dashboardService.getPopulationPyramid,
    staleTime: FIVE_MINUTES,
  });
}
