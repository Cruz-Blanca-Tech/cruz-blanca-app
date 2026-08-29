'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  triajeBatchesService,
  type BatchesSummaryFilters,
  type BatchesListFilters,
} from '../services/batches-service';
import {
  batchDetailService,
  type BatchCasesFilters,
} from '../services/batch-detail-service';
import { caseCorrectionService } from '../services/case-correction-service';
import type { EducaDossierData } from '../schemas/educa-case-schema';

/**
 * Query keys del feature `triaje` (lecturas de batches: summary, statuses,
 * listado). La data de API es estado de servidor → vive en TanStack Query.
 */
export const triajeKeys = {
  all: ['triaje'] as const,
  // Prefijos sin filtros: las mutaciones los usan para invalidar TODAS las
  // variantes (el match de `invalidateQueries` es por prefijo, así que
  // `['triaje', 'summary']` alcanza a `['triaje', 'summary', { ...filtros }]`).
  summaries: () => [...triajeKeys.all, 'summary'] as const,
  summary: (filters: BatchesSummaryFilters) =>
    [...triajeKeys.summaries(), filters] as const,
  statuses: ['triaje', 'statuses'] as const,
  lists: () => [...triajeKeys.all, 'batches'] as const,
  list: (filters: BatchesListFilters) => [...triajeKeys.lists(), filters] as const,
  casesByBatch: (batchId: string) =>
    [...triajeKeys.all, 'batch', batchId, 'cases'] as const,
  cases: (batchId: string, filters: BatchCasesFilters) =>
    [...triajeKeys.casesByBatch(batchId), filters] as const,
  batchSummary: (batchId: string) =>
    [...triajeKeys.all, 'batch', batchId, 'summary'] as const,
  // Hoja distinta (`detail`) para no colisionar con `cases`/`summary` del mismo lote.
  batchDetail: (batchId: string) =>
    [...triajeKeys.all, 'batch', batchId, 'detail'] as const,
  // Expediente EDUCA individual (pantalla TriajeCorreccion). Namespace propio
  // (`case`) para no colisionar con las hojas de lote (`batch/.../cases`).
  case: (caseId: string) => [...triajeKeys.all, 'case', caseId] as const,
  // Documentos del expediente para el visor. Se identifican por batchId + dniRef
  // (contexto intake), no por caseId → namespace propio (`case-documents`).
  caseDocuments: (batchId: string, dniRef: string) =>
    [...triajeKeys.all, 'case-documents', batchId, dniRef] as const,
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

/**
 * GET /batch/{batchId}/cases — expedientes del lote para el detalle de triaje.
 * Solo se consulta con un `batchId` válido (`enabled`). `keepPreviousData` evita
 * el parpadeo al paginar dentro del lote. No se fija `refetchInterval`: el
 * detalle se revalida al volver el foco/montar y tras las mutaciones del lote.
 */
export function useBatchCases(batchId: string | undefined, filters?: BatchCasesFilters) {
  return useQuery({
    queryKey: triajeKeys.cases(batchId ?? '', filters ?? {}),
    queryFn: () => batchDetailService.getBatchCases(batchId as string, filters),
    enabled: Boolean(batchId),
    placeholderData: keepPreviousData,
  });
}

/**
 * GET /batch/{batchId}/summary — resumen agregado del lote (total + conteo por
 * veredicto) para el footer del detalle. Solo se consulta con un `batchId`
 * válido (`enabled`); se revalida tras las mutaciones del lote (ver
 * `invalidateBatchState`).
 */
export function useBatchDetailSummary(batchId: string | undefined) {
  return useQuery({
    queryKey: triajeKeys.batchSummary(batchId ?? ''),
    queryFn: () => batchDetailService.getBatchSummary(batchId as string),
    enabled: Boolean(batchId),
  });
}

/**
 * GET /batches/{batchId} — metadata del lote individual para el header del
 * detalle de triaje (programa, actividad, fecha, estado). Solo se consulta con
 * un `batchId` válido (`enabled`). Sustituye a la lectura del caché del listado:
 * funciona igual entrando directo por URL o recargando (F5). Se revalida tras
 * las mutaciones del lote (ver `invalidateBatchState`).
 */
export function useBatch(batchId: string | undefined) {
  return useQuery({
    queryKey: triajeKeys.batchDetail(batchId ?? ''),
    queryFn: () => triajeBatchesService.getBatch(batchId as string),
    enabled: Boolean(batchId),
  });
}

/**
 * GET /educa/{caseId} — expediente EDUCA para la pantalla de corrección. Solo se
 * consulta con un `caseId` válido (`enabled`). No se fija `refetchInterval`: es
 * una vista de edición puntual (se revalida al montar/recuperar el foco); tras
 * guardar (PATCH) el caché se siembra con la respuesta de la mutación en vez de
 * re-consultar (ver Parte 4).
 */
export function useEducaCase(caseId: string | undefined) {
  return useQuery({
    queryKey: triajeKeys.case(caseId ?? ''),
    queryFn: () => caseCorrectionService.getEducaCase(caseId as string),
    enabled: Boolean(caseId),
  });
}

/**
 * GET /batches/{batchId}/dossiers/{dniRef}/documents — documentos (imágenes) del
 * expediente para el visor de la corrección. Solo se consulta con `batchId` y
 * `dniRef` válidos (`enabled`). Los documentos son estables una vez procesado el
 * OCR, así que se cachean generosamente (`staleTime` largo) y sin
 * `refetchInterval`. `dniRef` es el identificador estable del dossier, no el
 * `beneficiary.dni` (que se corrige en esta pantalla).
 */
export function useCaseDocuments(
  batchId: string | undefined,
  dniRef: string | undefined
) {
  return useQuery({
    queryKey: triajeKeys.caseDocuments(batchId ?? '', dniRef ?? ''),
    queryFn: () =>
      caseCorrectionService.getCaseDocuments(batchId as string, dniRef as string),
    enabled: Boolean(batchId) && Boolean(dniRef),
    staleTime: FIVE_MINUTES,
  });
}

/**
 * Invalida las queries afectadas cuando cambia el estado de un lote (aprobación
 * o rechazo masivos): el resumen y el listado de la bandeja, más los casos del
 * propio lote. Se devuelve la promesa para que la mutación no se considere
 * resuelta hasta que el refetch quede en marcha.
 */
export function invalidateBatchState(
  queryClient: ReturnType<typeof useQueryClient>,
  batchId: string
) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: triajeKeys.summaries() }),
    queryClient.invalidateQueries({ queryKey: triajeKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: triajeKeys.casesByBatch(batchId) }),
    queryClient.invalidateQueries({ queryKey: triajeKeys.batchSummary(batchId) }),
    queryClient.invalidateQueries({ queryKey: triajeKeys.batchDetail(batchId) }),
  ]);
}

/**
 * POST /batch/{batchId}/verify-completion — aprueba el lote (lo marca como
 * completado si todos sus expedientes están resueltos). Al tener éxito, refresca
 * la bandeja (resumen + listado) y los casos del lote.
 */
export function useVerifyBatchCompletion(batchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => batchDetailService.verifyBatchCompletion(batchId),
    onSuccess: () => invalidateBatchState(queryClient, batchId),
  });
}

/**
 * POST /batch/{batchId}/reject — rechaza en masa los expedientes pendientes del
 * lote. La mutación recibe el `reason` (obligatorio en el backend). Al tener
 * éxito, refresca la bandeja (resumen + listado) y los casos del lote.
 */
export function useRejectBatch(batchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => batchDetailService.rejectBatch(batchId, reason),
    onSuccess: () => invalidateBatchState(queryClient, batchId),
  });
}

/**
 * PATCH /educa/{caseId} — guarda la corrección del expediente EDUCA. Necesita el
 * `batchId` además del `caseId` para invalidar las vistas del lote padre (el
 * veredicto/estado del caso cambió).
 *
 * `onSuccess` siembra el caché del caso con la respuesta del PATCH
 * (`setQueryData`) en vez de invalidar la query del caso: invalidarla dispararía
 * un GET extra innecesario (la respuesta ya es un superset del GET). Solo se
 * invalidan las vistas del lote (`invalidateBatchState`: resumen + listado de la
 * bandeja, casos y resumen del lote), porque el estado agregado sí cambió.
 */
export function useSubmitCorrection(caseId: string, batchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (correctedData: EducaDossierData) =>
      caseCorrectionService.submitCorrection(caseId, correctedData),
    onSuccess: (res) => {
      queryClient.setQueryData(triajeKeys.case(caseId), res);
      return invalidateBatchState(queryClient, batchId);
    },
  });
}

/**
 * POST /educa/{caseId}/reject — rechaza el expediente EDUCA con un motivo
 * (`reason`, obligatorio). Necesita el `batchId` para invalidar las vistas del
 * lote padre (el estado del caso cambió a rechazado).
 *
 * A diferencia del PATCH, el response solo confirma el rechazo (no trae el
 * expediente), así que NO se puede sembrar el caché del caso: se invalida
 * `triajeKeys.case(caseId)` para que la próxima lectura refleje el estado
 * rechazado, además de las vistas del lote (`invalidateBatchState`).
 */
export function useRejectCase(caseId: string, batchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => caseCorrectionService.rejectCase(caseId, reason),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: triajeKeys.case(caseId) }),
        invalidateBatchState(queryClient, batchId),
      ]),
  });
}
