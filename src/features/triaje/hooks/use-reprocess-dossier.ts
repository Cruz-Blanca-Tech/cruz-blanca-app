import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { triajeKeys, invalidateBatchState, setCaseReprocessing } from './use-triaje-queries';
import { apiClient } from '@/lib/api-client';
import { API_PATHS } from '@/lib/api-paths';

export function useReprocessDossier(batchId: string, caseDni: string, caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ message?: string }>(`${API_PATHS.batches}/${batchId}/dossiers/${caseDni}/reprocess`);
      return res;
    },
    onMutate: async () => {
      // Marcar globalmente que este caso se está reprocesando (persiste si navegas)
      setCaseReprocessing(queryClient, caseId, true);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Error al reprocesar el expediente');
      setCaseReprocessing(queryClient, caseId, false);
    },
    onSuccess: (res) => {
      toast.success(res?.message || 'Expediente reprocesado correctamente');
      setCaseReprocessing(queryClient, caseId, false);
      return Promise.all([
        invalidateBatchState(queryClient, batchId),
        queryClient.invalidateQueries({ queryKey: triajeKeys.caseDocuments(batchId, caseDni) }),
        queryClient.invalidateQueries({ queryKey: triajeKeys.case(caseId) }),
      ]);
    },
    onSettled: () => {
      // Asegurar que se limpia aunque onSuccess/onError fallen
      setCaseReprocessing(queryClient, caseId, false);
    },
  });
}
