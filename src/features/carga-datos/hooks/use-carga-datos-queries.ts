'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cargaDatosService } from '../services/activities-service';
import { batchesService } from '../services/batches-service';
import type { CreateActivityRequest, CreateBatchRequest } from '../types';

export const cargaDatosKeys = {
  all: ['carga-datos'] as const,
  programs: ['carga-datos', 'programs'] as const,
  documentCatalog: ['carga-datos', 'document-catalog'] as const,
  activities: (programId: string | null) =>
    ['carga-datos', 'activities', programId] as const,
};

const FIVE_MINUTES = 1000 * 60 * 5;

/** GET /programs/ con cache. */
export function usePrograms() {
  return useQuery({
    queryKey: cargaDatosKeys.programs,
    queryFn: cargaDatosService.getPrograms,
    staleTime: FIVE_MINUTES,
  });
}

/**
 * GET /document-catalog/ con cache.
 * `enabled` permite diferir la carga hasta que el modal se abra.
 */
export function useDocumentCatalog(enabled = true) {
  return useQuery({
    queryKey: cargaDatosKeys.documentCatalog,
    queryFn: cargaDatosService.getDocumentCatalog,
    staleTime: FIVE_MINUTES,
    enabled,
  });
}

/** GET /activities/?program_id= con cache. */
export function useActivities(programId: string | null, enabled = true) {
  return useQuery({
    queryKey: cargaDatosKeys.activities(programId),
    queryFn: () => cargaDatosService.getActivities(programId),
    staleTime: FIVE_MINUTES,
    enabled,
  });
}

/** POST /activities/ — invalida la lista de actividades del programa al crear. */
export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateActivityRequest) =>
      cargaDatosService.createActivity(payload),
    onSuccess: (_activity, variables) => {
      queryClient.invalidateQueries({
        queryKey: cargaDatosKeys.activities(variables.program_id),
      });
    },
  });
}

/** POST /batches/ — crea un batch de extracción con los archivos de Drive. */
export function useCreateBatch() {
  return useMutation({
    mutationFn: (payload: CreateBatchRequest) =>
      batchesService.createBatch(payload),
  });
}
