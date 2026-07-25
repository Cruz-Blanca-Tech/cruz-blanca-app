import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { API_PATHS } from '@/lib/api-paths';
import { triajeKeys } from './use-triaje-queries';
export interface UploadMissingDocPayload {
  document_code: string;
  file: {
    file_name: string;
    source_id: string;
  };
}

export interface UploadMissingDocResult {
  message: string;
  document_id: string;
}

export function useUploadMissingDoc(batchId: string, caseDni: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UploadMissingDocPayload): Promise<UploadMissingDocResult> => {
      try {
        const response = await apiClient.post<UploadMissingDocResult>(
          `${API_PATHS.batches}/${batchId}/dossiers/${caseDni}/documents`,
          payload
        );
        return response;
      } catch (err: any) {
        throw new Error(err.message || 'Error al subir documento');
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Error al procesar el documento');
    },
    onSuccess: () => {
      // Invalidar el caso y el lote para forzar el refetch
      queryClient.invalidateQueries({ queryKey: triajeKeys.all });
    },
  });
}
