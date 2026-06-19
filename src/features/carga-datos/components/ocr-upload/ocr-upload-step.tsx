'use client';

import { useMemo } from 'react';
import { ArrowLeft, ScanLine, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import {
  useActivities,
  useDocumentCatalog,
  usePrograms,
} from '../../hooks/use-carga-datos-queries';
import { useCargaDatosStore } from '../../stores/carga-datos-store';
import type { ExpectedDocument } from '../../types';

import { DocumentDropzone } from './document-dropzone';
import { ExpectedDocuments } from './expected-documents';
import { FileNamingHelp } from './file-naming-help';
import { OcrHelpNote } from './ocr-help-note';
import { OcrStepper } from './ocr-stepper';
import { ProgramActivityStep } from './program-activity-step';

export function OcrUploadStep() {
  const selectedProgramId = useCargaDatosStore((s) => s.selectedProgramId);
  const selectedActivityId = useCargaDatosStore((s) => s.selectedActivityId);
  const selectedFile = useCargaDatosStore((s) => s.selectedFile);
  const setSelectedFile = useCargaDatosStore((s) => s.setSelectedFile);

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

  const canProceed = Boolean(
    selectedFile && selectedProgramId && selectedActivityId
  );

  const missing: string[] = [];
  if (!selectedFile) missing.push('archivo');
  if (!selectedProgramId) missing.push('programa');
  if (!selectedActivityId) missing.push('actividad');

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

          <DocumentDropzone
            file={selectedFile}
            onFile={setSelectedFile}
            onRemove={() => setSelectedFile(null)}
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
              {!canProceed && (
                <span className="hidden font-data text-xs text-muted-foreground sm:inline">
                  Falta seleccionar: {missing.join(', ')}
                </span>
              )}
              <Button size="lg" disabled={!canProceed}>
                <ScanLine />
                Iniciar extracción
              </Button>
            </div>
          </footer>
        </CardContent>
      </Card>
    </div>
  );
}
