'use client';

import {
  AlertTriangle,
  ArrowRight,
  FileX,
  Files,
  Info,
  Loader2,
  Plus,
  UploadCloud,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import type { CreateBatchResponse } from '../../schemas/create-batch-schema';
import type { BatchSummary } from '../../types';
import { OcrStepper } from './ocr-stepper';

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
  const hasFailed = result.total_failed_files > 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 overflow-y-auto custom-scrollbar">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Procesando documentos
        </h1>
        <p className="text-sm text-muted-foreground">
          La IA está extrayendo datos de los archivos que subiste.
        </p>
      </header>

      <OcrStepper current={2} />

      <Card className="mx-auto w-full max-w-3xl gap-0 py-0">
        {/* Hero: spinner + estado del procesamiento */}
        <div className="flex flex-col items-center gap-4 border-b border-border bg-gradient-to-b from-muted/40 to-card px-8 py-9 text-center">
          <Loader2 className="size-14 animate-spin text-primary" />
          <div className="flex flex-col items-center gap-2">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Estamos procesando tus documentos
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              En unos minutos estarán listos para revisión. Puedes cerrar esta ventana o continuar con otra tarea — te avisaremos cuando terminen.
            </p>
          </div>
        </div>

        {/* Resumen de la carga */}
        <section className="flex flex-col gap-3 px-8 py-5">
          <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Resumen de la carga
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
              Archivos que fallaron
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
          <div className="flex items-center gap-4 rounded-lg border border-primary bg-secondary px-5 py-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-card text-primary">
              <UploadCloud className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                ¿Tienes más archivos para subir?
              </p>
              <p className="font-data text-xs leading-snug text-muted-foreground">
                Puedes seguir cargando archivos de otro tipo de actividad
                mientras estos se procesan.
              </p>
            </div>
            <Button onClick={onUploadMore} className="shrink-0">
              <Plus />
              Subir archivos de otra actividad
            </Button>
          </div>
        </section>

        {/* Footer: nota + enlace a bandeja de triaje (ruta pendiente) */}
        <footer className="flex flex-col gap-3 border-t border-border bg-muted/30 px-8 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5 font-data text-xs text-muted-foreground">
            <Info className="size-3.5" />
            Verás todos los lotes en proceso y finalizados en la bandeja de
            triaje.
          </p>
          {/* TODO: ruta de triaje pendiente — habilitar cuando exista la página. */}
          <Button variant="link" size="sm" className="self-end px-0" disabled>
            Ir a la bandeja de triaje
            <ArrowRight />
          </Button>
        </footer>
      </Card>
    </div>
  );
}
