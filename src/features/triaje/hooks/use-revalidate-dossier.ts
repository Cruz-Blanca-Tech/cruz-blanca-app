'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dossierService } from '../services/dossier-service';
import { triajeKeys, invalidateBatchState } from './use-triaje-queries';

/**
 * POST /batches/{batchId}/dossiers/{dniReference}/revalidate
 *
 * Dispara la re-evaluación del expediente en el backend. Sin cuerpo. Idempotente:
 * si ya no hay nada que procesar devuelve `status: "NO_ACTION_NEEDED"`.
 *
 * Tras el éxito invalida de forma dirigida: las vistas del lote
 * (`invalidateBatchState`), los documentos del expediente y —si se conoce el
 * `caseId`— la vista de corrección del caso. Se evita el `triajeKeys.all`
 * anterior, que refetcheaba las listas/summaries de todos los lotes de la app.
 */
export function useRevalidateDossier(
  batchId: string,
  dniReference: string,
  caseId?: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dossierService.revalidate(batchId, dniReference),
    onSuccess: () =>
      Promise.all([
        invalidateBatchState(queryClient, batchId),
        queryClient.invalidateQueries({
          queryKey: triajeKeys.caseDocuments(batchId, dniReference),
        }),
        caseId
          ? queryClient.invalidateQueries({ queryKey: triajeKeys.case(caseId) })
          : Promise.resolve(),
      ]),
  });
}
