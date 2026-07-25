'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { API_PATHS } from '@/lib/api-paths';
import { triajeKeys } from './use-triaje-queries';

export interface RevalidateDossierResult {
  status: 'REVALIDATING' | 'NO_ACTION_NEEDED';
  batch_id?: string;
  dni_reference?: string;
  message?: string;
  detail?: unknown;
}

/**
 * POST /batches/{batchId}/dossiers/{dniReference}/revalidate
 *
 * Dispara la re-evaluación del expediente en el backend.
 * Sin cuerpo. Idempotente: si ya no hay nada que procesar devuelve
 * `status: "NO_ACTION_NEEDED"`.
 *
 * Tras una respuesta exitosa se invalidan las queries del lote y del caso
 * para que la UI refleje el nuevo estado.
 */
export function useRevalidateDossier(batchId: string, dniReference: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiClient.post<RevalidateDossierResult>(
        `${API_PATHS.batches}/${batchId}/dossiers/${dniReference}/revalidate`
      ),
    onSuccess: () => {
      // Refrescamos el caso individual y todas las vistas del lote
      void queryClient.invalidateQueries({ queryKey: triajeKeys.all });
    },
  });
}
