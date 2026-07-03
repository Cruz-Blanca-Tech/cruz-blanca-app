'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { intakeKeys } from '@/shared/hooks/use-intake-queries';
import { cargaDatosService } from '../services/activities-service';
import { batchesService } from '../services/batches-service';
import type { CreateActivityRequest, CreateBatchRequest } from '../types';

/**
 * Query keys propias de `carga-datos`. El dominio de lectura compartido
 * (programas y actividades) usa `intakeKeys` de `@/shared/hooks`.
 */
export const cargaDatosKeys = {
  all: ['carga-datos'] as const,
  documentCatalog: ['carga-datos', 'document-catalog'] as const,
};

const FIVE_MINUTES = 1000 * 60 * 5;

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

/**
 * POST /activities/ — invalida la lista de actividades del programa al crear.
 * La lista vive en el dominio compartido, así que se invalida con `intakeKeys`.
 */
export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateActivityRequest) =>
      cargaDatosService.createActivity(payload),
    onSuccess: (_activity, variables) => {
      queryClient.invalidateQueries({
        queryKey: intakeKeys.activities(variables.program_id),
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
