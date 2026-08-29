'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { dossierService } from '../services/dossier-service';
import { triajeKeys, invalidateBatchState } from './use-triaje-queries';
import type { UploadMissingDocPayload } from '../schemas/dossier-schema';

/**
 * POST /batches/{batchId}/dossiers/{caseDni}/documents — sube un documento
 * faltante del expediente.
 *
 * Tras el éxito invalida de forma dirigida (ver `useRevalidateDossier`): vistas
 * del lote, documentos del expediente y —si se conoce el `caseId`— la vista de
 * corrección del caso.
 */
export function useUploadMissingDoc(
  batchId: string,
  caseDni: string,
  caseId?: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UploadMissingDocPayload) =>
      dossierService.uploadMissingDoc(batchId, caseDni, payload),
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Error al procesar el documento');
    },
    onSuccess: () =>
      Promise.all([
        invalidateBatchState(queryClient, batchId),
        queryClient.invalidateQueries({
          queryKey: triajeKeys.caseDocuments(batchId, caseDni),
        }),
        caseId
          ? queryClient.invalidateQueries({ queryKey: triajeKeys.case(caseId) })
          : Promise.resolve(),
      ]),
  });
}
