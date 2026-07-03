'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { downloadReport } from '../services/reportes-service';

/**
 * Mutación que envuelve `downloadReport`. Se instancia UNA VEZ POR TARJETA (no
 * es global) para que `isPending` quede acotado al reporte que se está
 * descargando: así solo ese botón muestra el spinner y se deshabilita.
 *
 * La descarga no es una lectura cacheable ni un cambio de estado de servidor;
 * usamos `useMutation` únicamente por su manejo de estado (`isPending`) y el
 * feedback con toasts (`sonner`): error → mensaje del `Error` lanzado por el
 * servicio; éxito → aviso de que la descarga comenzó.
 */
export function useReportDownload() {
  return useMutation({
    mutationFn: ({ reportId, filename }: { reportId: string; filename: string }) =>
      downloadReport(reportId, filename),
    onSuccess: () => toast.success('Descarga iniciada'),
    onError: (error: Error) => toast.error(error.message),
  });
}
