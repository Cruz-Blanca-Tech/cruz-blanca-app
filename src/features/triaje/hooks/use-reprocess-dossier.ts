'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { triajeKeys, invalidateBatchState } from './use-triaje-queries';
import { apiClient } from '@/lib/api-client';
import { API_PATHS } from '@/lib/api-paths';

export function useReprocessDossier(batchId: string, caseDni: string, caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ message?: string }>(`${API_PATHS.batches}/${batchId}/dossiers/${caseDni}/reprocess`);
      return res;
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Error al reprocesar el expediente');
    },
    onSuccess: (res) => {
      // The toast is fired in the UI now, we'll return the response so the UI can use it
      return Promise.all([
        invalidateBatchState(queryClient, batchId),
        queryClient.invalidateQueries({ queryKey: triajeKeys.caseDocuments(batchId, caseDni) }),
        queryClient.invalidateQueries({ queryKey: triajeKeys.case(caseId) }),
      ]);
    },
  });
}
