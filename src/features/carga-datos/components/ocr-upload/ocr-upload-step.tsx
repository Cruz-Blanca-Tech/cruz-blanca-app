'use client';

import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, ScanLine, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import {
  useActivities,
  useCreateBatch,
  useDocumentCatalog,
  usePrograms,
} from '../../hooks/use-carga-datos-queries';
import { useCargaDatosStore } from '../../stores/carga-datos-store';
import type {
  BatchSummary,
  CreateBatchResponse,
  ExpectedDocument,
  PickedFile,
} from '../../types';

import { ExpectedDocuments } from './expected-documents';
import { GoogleDrivePicker } from './google-drive-picker';
import { FileNamingHelp } from './file-naming-help';
import { OcrHelpNote } from './ocr-help-note';
import { OcrStepper } from './ocr-stepper';
import { ProgramActivityStep } from './program-activity-step';

interface OcrUploadStepProps {
  /**
   * Notifica al wizard que el batch se creó correctamente para avanzar al
   * Paso 2. El `summary` lo arma este paso porque ya tiene los datos de lo
   * enviado (programa, actividad y cantidad de archivos).
   */
  onBatchCreated: (result: CreateBatchResponse, summary: BatchSummary) => void;
}

export function OcrUploadStep({ onBatchCreated }: OcrUploadStepProps) {
  const selectedProgramId = useCargaDatosStore((s) => s.selectedProgramId);
  const selectedActivityId = useCargaDatosStore((s) => s.selectedActivityId);

  const [files, setFiles] = useState<PickedFile[]>([]);
  const createBatch = useCreateBatch();

  const handlePick = useCallback((picked: PickedFile[]) => {
    // Fusiona y deduplica por source_id (el Picker puede reabrirse varias veces).
    setFiles((prev) => {
      const bySourceId = new Map(prev.map((f) => [f.source_id, f]));
      for (const file of picked) bySourceId.set(file.source_id, file);
      return Array.from(bySourceId.values());
    });
  }, []);

  const handleRemove = useCallback((sourceId: string) => {
    setFiles((prev) => prev.filter((f) => f.source_id !== sourceId));
  }, []);

  const programs = usePrograms();
  const activities = useActivities(
    selectedProgramId,
    Boolean(selectedProgramId)
  );
  // El catálogo solo es necesario para resolver los documentos de la actividad.
  const documentCatalog = useDocumentCatalog(Boolean(selectedActivityId));

  const programLabel = programs.data?.find(
    (p) => p.id === selectedProgramId
  )?.name;

  const activity =
    activities.data?.find((a) => a.id === selectedActivityId) ?? null;

  // Combina los requisitos de la actividad con el catálogo para la vista previa.
  const documents = useMemo<ExpectedDocument[]>(() => {
    if (!activity) return [];
    const catalogById = new Map(
      (documentCatalog.data ?? []).map((doc) => [doc.id, doc])
    );
    return activity.requirements.map((req) => {
      const catalog = catalogById.get(req.document_type_config_id);
      return {
        id: req.document_type_config_id,
        name: catalog?.name ?? 'Documento',
        code: catalog?.code ?? '—',
        year: catalog?.year ?? 0,
        previewImageUrl: catalog?.preview_image_url ?? null,
        confidenceThreshold: req.confidence_threshold,
      };
    });
  }, [activity, documentCatalog.data]);

  const hasActivity = Boolean(selectedActivityId);
  const documentsLoading =
    hasActivity && (activities.isLoading || documentCatalog.isLoading);

  const hasFiles = files.length > 0;
  const canProceed = Boolean(selectedActivityId) && hasFiles;

  const missing: string[] = [];
  if (!hasFiles) missing.push('archivos');
  if (!selectedActivityId) missing.push('actividad');

  const handleSubmit = useCallback(() => {
    if (!selectedActivityId) {
      toast.error('Selecciona una actividad antes de iniciar la extracción.');
      return;
    }
    if (!hasFiles) {
      toast.error('Selecciona al menos un archivo de Google Drive.');
      return;
    }

    // Capturamos el resumen de lo enviado: el frontend es la fuente de verdad
    // del conteo de archivos (no se pide al backend).
    const summary: BatchSummary = {
      programLabel: programLabel ?? '—',
      activityLabel: activity?.name ?? '—',
      filesCount: files.length,
      submittedAt: new Date(),
    };

    createBatch.mutate(
      { activity_id: selectedActivityId, files },
      {
        onSuccess: (result) => {
          // En vez de toast+reset, avanzamos al Paso 2 con el response del batch
          // y el resumen de la carga. El detalle de fallidos se muestra allí.
          onBatchCreated(result, summary);
        },
        onError: (err) => {
          toast.error(
            err instanceof Error
              ? err.message
              : 'No se pudo iniciar la extracción.'
          );
        },
      }
    );
  }, [
    activity,
    createBatch,
    files,
    hasFiles,
    onBatchCreated,
    programLabel,
    selectedActivityId,
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Nueva Digitalización
        </h1>
        <p className="text-sm text-muted-foreground">
          Carga una ficha escaneada para extraer sus datos automáticamente.
        </p>
      </header>

      <OcrStepper current={1} />

      <Card className="mx-auto w-full max-w-3xl">
        <CardContent className="flex flex-col gap-5">
          <h2 className="flex items-center gap-2 font-heading text-md font-medium text-foreground">
            <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-primary">
              <Upload className="size-3.5" />
            </span>
            Subir documento
          </h2>

          <GoogleDrivePicker
            files={files}
            onPick={handlePick}
            onRemove={handleRemove}
            disabled={createBatch.isPending}
          />

          <ProgramActivityStep />

          <ExpectedDocuments
            documents={documents}
            programLabel={programLabel}
            activityLabel={activity?.name}
            hasActivity={hasActivity}
            isLoading={documentsLoading}
          />

          <FileNamingHelp documents={documents} />

          <OcrHelpNote />

          <footer className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <Button variant="ghost" size="sm" disabled>
              <ArrowLeft />
              Anterior
            </Button>

            <div className="flex items-center gap-3">
              {!canProceed && !createBatch.isPending && (
                <span className="hidden font-data text-xs text-muted-foreground sm:inline">
                  Falta seleccionar: {missing.join(', ')}
                </span>
              )}
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={!canProceed || createBatch.isPending}
              >
                {createBatch.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <ScanLine />
                )}
                {createBatch.isPending ? 'Iniciando…' : 'Iniciar extracción'}
              </Button>
            </div>
          </footer>
        </CardContent>
      </Card>
    </div>
  );
}
