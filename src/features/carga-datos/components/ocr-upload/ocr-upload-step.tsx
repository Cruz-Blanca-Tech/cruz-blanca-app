'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  ScanLine,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { useActivities, usePrograms } from '@/shared/hooks/use-intake-queries';
import {
  useCreateBatch,
  useDocumentCatalog,
} from '../../hooks/use-carga-datos-queries';
import { useCargaDatosStore } from '../../stores/carga-datos-store';
import {
  createBatchFormSchema,
  type CreateBatchFormValues,
  type CreateBatchResponse,
} from '../../schemas/create-batch-schema';
import type {
  BatchSummary,
  ExpectedDocument,
  PickedFile,
} from '../../types';

import { ExpectedDocuments } from './expected-documents';
import { GoogleDrivePicker } from './google-drive-picker';
import { FileValidationPreview } from './file-validation-preview';
import { FileNamingHelp } from './file-naming-help';
import { OcrHelpNote } from './ocr-help-note';
import { ProgramActivityStep } from './program-activity-step';
import { useBatchFileValidation } from '../../hooks/use-batch-file-validation';

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

  // Subfase interna: 'config' (Programa y Actividad) | 'upload' (Subida de archivos y Lote)
  const [subStep, setSubStep] = useState<'config' | 'upload'>('config');
  const [showGuideInUpload, setShowGuideInUpload] = useState(false);

  const [files, setFiles] = useState<PickedFile[]>([]);
  const [description, setDescription] = useState('');
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
        isRequired: req.is_required,
      };
    });
  }, [activity, documentCatalog.data]);

  const hasActivity = Boolean(selectedActivityId);
  const documentsLoading =
    hasActivity && (activities.isLoading || documentCatalog.isLoading);

  // Si se resetea la actividad o se pierde, regresar a 'config'
  useEffect(() => {
    if (!hasActivity && subStep === 'upload') {
      setSubStep('config');
    }
  }, [hasActivity, subStep]);

  const fileValidation = useBatchFileValidation(files, documents);

  const handleDiscardInvalid = useCallback(() => {
    const validSourceIds = new Set(
      fileValidation.validFiles.map((v) => v.file.source_id)
    );
    setFiles((prev) => prev.filter((f) => validSourceIds.has(f.source_id)));
  }, [fileValidation.validFiles]);

  // Validación centralizada del Paso 1: programa/actividad (store), archivos
  // (picker) y descripción (local) se validan con un único schema Zod.
  const validation = createBatchFormSchema.safeParse({
    activity_id: selectedActivityId ?? '',
    files,
    description,
  });
  const canProceed = validation.success && fileValidation.canSubmit;

  const handleSubmit = () => {
    if (!validation.success) {
      toast.error(
        validation.error.issues[0]?.message ??
          'Completa los campos requeridos antes de iniciar la extracción.'
      );
      return;
    }

    if (fileValidation.validCount === 0) {
      toast.error(
        'Ninguno de los archivos seleccionados es válido para esta actividad. Revisa la nomenclatura requerida.'
      );
      return;
    }

    if (fileValidation.hasInvalidFiles) {
      toast.info(
        `Se enviarán ${fileValidation.validCount} archivo(s) válidos (${fileValidation.invalidCount} inválido(s) ignorados).`
      );
    }

    if (fileValidation.hasIncompleteDossiers) {
      toast.warning(
        'Hay expedientes con documentos faltantes. Se procesarán y podrás anexar los faltantes en Triaje.'
      );
    }

    // Enviamos únicamente los archivos válidos al backend para proteger la extracción
    const payload = {
      ...validation.data,
      files: fileValidation.validFiles.map((v) => v.file),
    };

    // Capturamos el resumen de lo enviado: el frontend es la fuente de verdad
    // del conteo de archivos válidos (no se pide al backend).
    const summary: BatchSummary = {
      programLabel: programLabel ?? '—',
      activityLabel: activity?.name ?? '—',
      filesCount: payload.files.length,
      submittedAt: new Date(),
    };

    // Avanzamos al Paso 2 con el response del batch y el resumen de la carga
    createBatch.mutate(payload, {
      onSuccess: (result) => {
        onBatchCreated(result, summary);
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : 'No se pudo iniciar la extracción.'
        );
      },
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 overflow-y-auto custom-scrollbar">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Nueva Digitalización
        </h1>
        <p className="text-sm text-muted-foreground">
          Carga una ficha escaneada para extraer sus datos automáticamente.
        </p>
      </header>

      <Card className="mx-auto w-full max-w-3xl">
        <CardContent className="flex flex-col gap-5 pt-6">
          {subStep === 'config' ? (
            /* FASE 1: Selección de Programa y Actividad + Requisitos */
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    1
                  </span>
                  <div>
                    <h2 className="font-heading text-base font-semibold text-foreground">
                      Destino de la Digitalización
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Selecciona a qué programa y actividad pertenecen los documentos antes de subirlos.
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  Paso 1 de 2
                </Badge>
              </div>

              <ProgramActivityStep />

              {hasActivity ? (
                <div className="flex flex-col gap-5 pt-2">
                  <ExpectedDocuments
                    documents={documents}
                    programLabel={programLabel}
                    activityLabel={activity?.name}
                    hasActivity={hasActivity}
                    isLoading={documentsLoading}
                  />

                  <FileNamingHelp documents={documents} />
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-slate-50 px-4.5 py-6">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                    <Info className="size-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Selecciona un programa y actividad
                    </p>
                    <p className="mt-0.5 font-data text-xs text-muted-foreground">
                      Al elegir la actividad podrás ver los documentos requeridos y la convención de nombres para tus archivos.
                    </p>
                  </div>
                </div>
              )}

              <footer className="flex items-center justify-between gap-3 border-t border-border pt-4">
                <Button variant="ghost" size="sm" disabled>
                  <ArrowLeft className="size-4 mr-1" />
                  Anterior
                </Button>

                <div className="flex items-center gap-3">
                  {!hasActivity && (
                    <span className="hidden font-data text-xs text-muted-foreground sm:inline">
                      Selecciona el programa y la actividad para continuar
                    </span>
                  )}
                  <Button
                    size="lg"
                    disabled={!hasActivity || documentsLoading}
                    onClick={() => setSubStep('upload')}
                  >
                    Continuar a Subir Archivos
                    <ArrowRight className="size-4 ml-1" />
                  </Button>
                </div>
              </footer>
            </div>
          ) : (
            /* FASE 2: Subida de Archivos y Confirmación del Lote */
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 border-b border-border pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      2
                    </span>
                    <div>
                      <h2 className="font-heading text-base font-semibold text-foreground">
                        Carga de Documentos y Lote
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Selecciona los archivos escaneados desde Google Drive para iniciar la extracción.
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    Paso 2 de 2
                  </Badge>
                </div>

                {/* Banner de resumen de la actividad seleccionada */}
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Programa:</span>{' '}
                      <span className="font-semibold text-foreground">{programLabel ?? '—'}</span>
                    </div>
                    <div className="hidden h-4 w-px bg-border sm:block" />
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Actividad:</span>{' '}
                      <span className="font-semibold text-foreground">{activity?.name ?? '—'}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSubStep('config')}
                    className="h-8 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10"
                    disabled={createBatch.isPending}
                  >
                    <ArrowLeft className="size-3.5 mr-1" />
                    Cambiar actividad
                  </Button>
                </div>

                {/* Acordeón para consultar la guía de nombres y documentos requeridos */}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGuideInUpload((prev) => !prev)}
                    className="flex items-center justify-between rounded-md border border-dashed border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Info className="size-3.5 text-primary" />
                      {showGuideInUpload
                        ? 'Ocultar requisitos y guía de nomenclatura'
                        : 'Ver requisitos y guía de nomenclatura de esta actividad'}
                    </span>
                    {showGuideInUpload ? (
                      <ChevronUp className="size-3.5" />
                    ) : (
                      <ChevronDown className="size-3.5" />
                    )}
                  </button>

                  {showGuideInUpload && (
                    <div className="flex flex-col gap-4 rounded-lg border border-border bg-slate-50/50 p-3 pt-4">
                      <ExpectedDocuments
                        documents={documents}
                        programLabel={programLabel}
                        activityLabel={activity?.name}
                        hasActivity={hasActivity}
                        isLoading={documentsLoading}
                      />
                      <FileNamingHelp documents={documents} />
                    </div>
                  )}
                </div>
              </div>

              {/* Selector de Google Drive */}
              <div className="flex flex-col gap-2">
                <h3 className="flex items-center gap-2 font-heading text-sm font-medium text-foreground">
                  <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-primary">
                    <Upload className="size-3.5" />
                  </span>
                  Archivos a digitalizar
                </h3>
                <GoogleDrivePicker
                  files={files}
                  onPick={handlePick}
                  onRemove={handleRemove}
                  disabled={createBatch.isPending}
                />
              </div>

              <FileValidationPreview
                validation={fileValidation}
                onRemoveFile={handleRemove}
                onDiscardInvalid={handleDiscardInvalid}
                disabled={createBatch.isPending}
              />

              {/* Descripción del lote */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="batch-description">
                  Descripción del lote <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="batch-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej. Lote de fichas recibidas el 28/06 en la jornada de Comas — turno mañana. Notas para el equipo de revisión…"
                  rows={3}
                  className="resize-y"
                  disabled={createBatch.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Esta nota acompaña al lote durante todo el flujo y es visible en el
                  triaje y la revisión.
                </p>
              </div>

              <OcrHelpNote />

              <footer className="flex items-center justify-between gap-3 border-t border-border pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSubStep('config')}
                  disabled={createBatch.isPending}
                >
                  <ArrowLeft className="size-4 mr-1" />
                  Anterior
                </Button>

                <div className="flex items-center gap-3">
                  {!canProceed && !createBatch.isPending && (
                    <span className="hidden font-data text-xs text-muted-foreground sm:inline">
                      {files.length === 0
                        ? 'Falta seleccionar archivos de Drive'
                        : fileValidation.validCount === 0
                          ? 'No hay archivos con formato o código válido para esta actividad'
                          : !description.trim()
                            ? 'Falta ingresar la descripción del lote'
                            : 'Falta completar campos requeridos'}
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
