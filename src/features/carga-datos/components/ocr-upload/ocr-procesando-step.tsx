'use client';

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileX,
  Files,
  Info,
  Layers,
  Loader2,
  Plus,
  UploadCloud,
} from 'lucide-react';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { triajeKeys } from '@/features/triaje/hooks/use-triaje-queries';
import { triajeBatchesService } from '@/features/triaje/services/batches-service';

import type { CreateBatchResponse } from '../../schemas/create-batch-schema';
import type { BatchSummary } from '../../types';

interface OcrProcesandoStepProps {
  /** Respuesta inmediata de POST /api/v1/batches/. */
  result: CreateBatchResponse;
  /** Resumen de lo enviado, armado en el Paso 1. */
  summary: BatchSummary;
  /** Vuelve al Paso 1 reseteando archivos y estado. */
  onUploadMore: () => void;
}

/** Formatea la fecha de carga en es-PE: día/mes y hora:min. */
function formatSubmittedAt(date: Date): string {
  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function OcrProcesandoStep({
  result,
  summary,
  onUploadMore,
}: OcrProcesandoStepProps) {
  const router = useRouter();
  const hasFailed = result.total_failed_files > 0;

  // Hacemos polling del estado del lote en segundo plano
  const { data: batch } = useQuery({
    queryKey: triajeKeys.batchDetail(result.batch_id),
    queryFn: () => triajeBatchesService.getBatch(result.batch_id),
    refetchInterval: (query) => {
      if (!query.state.data) return 5000;
      const isProcessing = ['PENDING', 'PROCESSING'].includes(query.state.data.status);
      return isProcessing ? 5000 : false;
    },
  });

  // Redirigir automáticamente cuando deje de estar en proceso si sigue en esta pantalla
  useEffect(() => {
    if (batch && !['PENDING', 'PROCESSING'].includes(batch.status)) {
      router.push(`/triaje/${batch.id}`);
    }
  }, [batch, router]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 overflow-y-auto custom-scrollbar">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Lote Enviado a Procesamiento
        </h1>
        <p className="text-sm text-muted-foreground">
          Tus documentos se han recibido e ingresaron a la cola de extracción con IA.
        </p>
      </header>

      <Card className="mx-auto w-full max-w-3xl gap-0 py-0 overflow-hidden">
        {/* Hero: éxito + llamado a la acción hacia Triaje */}
        <div className="flex flex-col items-center gap-5 border-b border-border bg-gradient-to-b from-primary/5 to-card px-8 py-9 text-center">
          <div className="relative flex items-center justify-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-success-light text-success-dark">
              <CheckCircle2 className="size-9" />
            </span>
            <span
              title="Procesando en segundo plano"
              className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-card shadow-sm border border-border"
            >
              <Loader2 className="size-3.5 animate-spin text-primary" />
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h2 className="font-heading text-xl font-semibold text-foreground">
              ¡Lote enviado con éxito!
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              La IA está extrayendo los datos en segundo plano. Puedes regresar a la bandeja de triaje para monitorear el progreso o revisar otros expedientes.
            </p>
          </div>

          {/* Botones de acción principales */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              size="lg"
              onClick={() => router.push('/triaje')}
              className="gap-2 font-medium"
            >
              <Layers className="size-4.5" />
              Ir a la Bandeja de Triaje
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push(`/triaje/${result.batch_id}`)}
              className="gap-2"
            >
              Ver detalle de este lote
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Resumen de la carga */}
        <section className="flex flex-col gap-3 px-8 py-5">
          <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Resumen del lote enviado
          </h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-lg border border-border bg-muted/30 px-4 py-3.5 sm:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <dt className="font-data text-[10px] uppercase tracking-wider text-muted-foreground">
                Programa
              </dt>
              <dd>
                <Badge variant="secondary" className="font-medium">
                  {summary.programLabel}
                </Badge>
              </dd>
            </div>

            <div className="flex flex-col gap-1.5">
              <dt className="font-data text-[10px] uppercase tracking-wider text-muted-foreground">
                Actividad
              </dt>
              <dd className="text-sm font-medium text-foreground">
                {summary.activityLabel}
              </dd>
            </div>

            <div className="flex flex-col gap-1.5">
              <dt className="font-data text-[10px] uppercase tracking-wider text-muted-foreground">
                Archivos
              </dt>
              <dd className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Files className="size-3.5 text-primary" />
                {summary.filesCount} documentos
              </dd>
            </div>

            <div className="flex flex-col gap-1.5">
              <dt className="font-data text-[10px] uppercase tracking-wider text-muted-foreground">
                Cargado
              </dt>
              <dd className="font-data text-xs text-muted-foreground">
                {formatSubmittedAt(summary.submittedAt)}
              </dd>
            </div>
          </dl>
        </section>

        {/* Archivos que fallaron */}
        {hasFailed && (
          <section className="flex flex-col gap-3 px-8 pb-5">
            <h3 className="flex items-center gap-2 font-heading text-xs font-semibold uppercase tracking-wider text-destructive">
              <AlertTriangle className="size-3.5" />
              Archivos no procesados
              <Badge variant="destructive" className="font-data">
                {result.total_failed_files}
              </Badge>
            </h3>
            <ul className="divide-y divide-destructive/15 overflow-y-auto custom-scrollbar rounded-lg border border-destructive/30 bg-destructive/[0.04] max-h-[300px]">
              {result.failed_files.map((file) => (
                <li
                  key={file.file_name}
                  className="flex items-start gap-3 px-4 py-3.5"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                    <FileX className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-data text-sm font-bold break-all text-foreground">
                      {file.file_name}
                    </p>
                    <p className="text-sm leading-snug text-destructive">
                      {file.reason}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CTA: subir más archivos */}
        <section className="px-8 pb-5">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/40 px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                ¿Deseas digitalizar otro lote?
              </p>
              <p className="font-data text-xs leading-snug text-muted-foreground">
                Puedes iniciar una nueva carga mientras este lote termina de procesarse.
              </p>
            </div>
            <Button variant="secondary" onClick={onUploadMore} className="shrink-0 gap-1.5">
              <Plus className="size-4" />
              Cargar otro lote
            </Button>
          </div>
        </section>

        {/* Footer: nota informativa */}
        <footer className="flex flex-col gap-3 border-t border-border bg-muted/30 px-8 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5 font-data text-xs text-muted-foreground">
            <Info className="size-3.5 shrink-0" />
            Puedes cerrar esta pestaña o navegar con tranquilidad; te notificaremos el estado en la bandeja de triaje.
          </p>
        </footer>
      </Card>
    </div>
  );
}
