'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Info, Loader2, ScanLine } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  type CreateBatchResponse,
} from '../../schemas/create-batch-schema';
import type {
  BatchSummary,
  ExpectedDocument,
  PickedFile,
} from '../../types';

import { ExpectedDocuments } from './expected-documents';
import {
  GoogleDrivePicker,
  type GoogleDrivePickerHandle,
} from './google-drive-picker';
import { DossierBoard } from './dossier-board';
import { FileNamingHelp } from './file-naming-help';
import { OcrHelpNote } from './ocr-help-note';
import { ProgramActivityStep } from './program-activity-step';
import { StartOverButton } from './start-over-button';
import {
  composeFileName,
  useBatchFileValidation,
} from '../../hooks/use-batch-file-validation';

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
  const files = useCargaDatosStore((s) => s.pickedFiles);
  const originalNames = useCargaDatosStore((s) => s.originalNames);
  const addPickedFiles = useCargaDatosStore((s) => s.addPickedFiles);
  const renamePickedFile = useCargaDatosStore((s) => s.renamePickedFile);
  const removePickedFile = useCargaDatosStore((s) => s.removePickedFile);
  const clearPickedFiles = useCargaDatosStore((s) => s.clearPickedFiles);
  const resetStore = useCargaDatosStore((s) => s.reset);

  // Subfase interna: 'config' (Programa y Actividad) | 'upload' (Subida de archivos y Lote)
  const [subStep, setSubStep] = useState<'config' | 'upload'>('config');
  // La galería de huecos abre el selector de Drive desde adentro del tablero.
  const drivePickerRef = useRef<GoogleDrivePickerHandle>(null);

  const [description, setDescription] = useState('');
  const createBatch = useCreateBatch();

  const handlePick = useCallback(
    (picked: PickedFile[]) => addPickedFiles(picked),
    [addPickedFiles]
  );

  const handleRemove = useCallback(
    (sourceId: string) => removePickedFile(sourceId),
    [removePickedFile]
  );

  /**
   * Coloca un archivo en un expediente con un tipo de documento.
   *
   * Solo se cambia el `file_name`, que es de donde el backend saca la clave de
   * agrupación y el código (`RawFileMapper` toma el nombre tal cual viene del
   * cliente; los bytes se bajan por `source_id`). El archivo no se renombra en
   * Drive: el nombre que importa es el que tiene dentro del sistema.
   */
  const handleAssign = useCallback(
    (sourceId: string, key: string, code: string) => {
      const current = files.find((f) => f.source_id === sourceId);
      if (!current) return false;
      const nextName = composeFileName(key, code, current.file_name);
      if (nextName === current.file_name) return false;
      renamePickedFile(sourceId, nextName);
      return true;
    },
    [files, renamePickedFile]
  );

  /**
   * Si el archivo tiene un nombre al cual volver, distinto del actual.
   *
   * Es la condición para que un intercambio sea posible: si el nombre original
   * ya es el nombre asignado (el archivo venía de Drive bien nombrado), no hay
   * a qué deshacer el renombrado, y el archivo no quedaría sin destino.
   */
  const handleCanUnassign = useCallback(
    (sourceId: string) => {
      const original = originalNames[sourceId];
      const current = files.find((f) => f.source_id === sourceId);
      return Boolean(original && current && original !== current.file_name);
    },
    [files, originalNames]
  );

  /** Devuelve un archivo a la bandeja restaurando el nombre que tenía en Drive. */
  const handleUnassign = useCallback(
    (sourceId: string) => {
      const original = originalNames[sourceId];
      const current = files.find((f) => f.source_id === sourceId);
      if (!original || !current || original === current.file_name) return false;
      renamePickedFile(sourceId, original);
      return true;
    },
    [files, originalNames, renamePickedFile]
  );

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

  // Si se resetea la actividad o se pierde, regresar a 'config'. Se ajusta el
  // estado durante el render (patrón React) en lugar de un useEffect con
  // setState síncrono (regla react-hooks/set-state-in-effect).
  const [lastJumpFlag, setLastJumpFlag] = useState<boolean | null>(null);
  const shouldJumpToConfig = !hasActivity && subStep === 'upload';
  if (shouldJumpToConfig !== lastJumpFlag) {
    setLastJumpFlag(shouldJumpToConfig);
    if (shouldJumpToConfig) {
      setSubStep('config');
    }
  }


  const fileValidation = useBatchFileValidation(files, documents);

  /**
   * Las dos formas de abandonar el lote en curso.
   *
   * La descripción va en el mismo gesto porque es parte de la carga: dejarla
   * escrita llevaría a mandar el lote nuevo con la explicación del anterior.
   *
   * El paso activo no hay que tocarlo a mano: `reset()` deja la actividad sin
   * seleccionar, y el salto a 'config' que hay más arriba ya reacciona a eso.
   */
  const handleClearFiles = useCallback(() => {
    clearPickedFiles();
    setDescription('');
  }, [clearPickedFiles]);

  const handleResetAll = useCallback(() => {
    resetStore();
    setDescription('');
  }, [resetStore]);

  // Validación centralizada del Paso 1: programa/actividad (store), archivos
  // (picker) y descripción (local) se validan con un único schema Zod.
  const validation = createBatchFormSchema.safeParse({
    activity_id: selectedActivityId ?? '',
    files,
    description,
  });
  // El bloqueo por expedientes incompletos es deliberado y se queda: es el
  // control de calidad de la carga. El operador ve exactamente qué documento
  // falta (el hueco `✗` del tablero) y tiene tres salidas limpias — arrastrarle
  // un archivo, elegirlo con un clic, o quitar el expediente entero con la ✕ y
  // seguir sin él. Subir un lote con expedientes a medias solo produce casos
  // que hay que reparar después.
  //
  // El backend tampoco aborta el lote (nunca lo hizo bien: tumbaba a los
  // expedientes completos junto con el incompleto), pero marca el incompleto
  // INCOMPLETE, lo saltea del OCR y lo manda a triaje pidiendo el faltante.
  const canProceed =
    fileValidation.validCount > 0 &&
    !fileValidation.hasIncompleteDossiers &&
    description.trim().length > 0;

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

    // Enviamos únicamente los archivos válidos al backend para proteger la
    // extracción. Los que están en la bandeja sin destino NO se avisan acá con
    // un toast: la bandeja es permanente y visible en la misma pantalla, así
    // que el conteo no se pierde a los cuatro segundos.
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
    <div className="flex flex-1 flex-col overflow-y-auto custom-scrollbar">
      <div className="flex-1 px-6 py-5">
        <Card className="mx-auto w-full max-w-5xl">
          <CardContent className="flex flex-col gap-5 pt-6">
            {subStep === 'config' ? (
              /* FASE 1: Selección de Programa y Actividad + Requisitos */
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    1
                  </span>
                  <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                      Nueva Digitalización
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Escaneá los documentos, revisá cómo se agruparon y
                      extraemos los datos de cada ficha.
                    </p>
                  </div>
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
                        Al elegir la actividad vas a ver qué documentos hay que
                        subir y cómo se nombran.
                      </p>
                    </div>
                  </div>
                )}

                <footer className="flex items-center justify-between gap-3 border-t border-border pt-4">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" disabled>
                      <ArrowLeft className="size-4 mr-1" />
                      Anterior
                    </Button>
                    {/* También en el paso 1, y no solo en la barra del paso 2:
                        un refresh siempre vuelve acá —el paso activo no se
                        persiste— y deja los archivos del lote anterior
                        esperando en el store, invisibles hasta que el operador
                        toca "Continuar". Sin esta salida, la única forma de
                        vaciar 181 filas era con la ✕ de a una. */}
                    <StartOverButton
                      fileCount={files.length}
                      programLabel={programLabel ?? null}
                      activityName={activity?.name ?? null}
                      onClearFiles={handleClearFiles}
                      onResetAll={handleResetAll}
                    />
                  </div>

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
                {/* Destino del lote. Sticky dentro de la tarjeta: es el dato
                    que decide si los códigos de los archivos son válidos, y
                    antes quedaba arriba de una lista de 233 filas. */}
                {hasActivity && (
                  <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-primary/25 bg-primary/5 px-3.5 py-2.5">
                    <span className="rounded bg-primary px-1.5 py-0.5 font-data text-[10px] font-bold tracking-wider text-primary-foreground uppercase">
                      Programa
                    </span>
                    <span className="font-heading text-sm font-semibold text-foreground">
                      {programLabel ?? '—'}
                    </span>
                    <span className="hidden h-4 w-px bg-primary/25 sm:block" />
                    <span className="rounded bg-primary px-1.5 py-0.5 font-data text-[10px] font-bold tracking-wider text-primary-foreground uppercase">
                      Actividad
                    </span>
                    <span className="font-heading text-sm font-semibold text-foreground">
                      {activity?.name ?? '—'}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSubStep('config')}
                      className="ml-auto h-7 text-xs font-medium text-primary hover:bg-primary/10"
                      disabled={createBatch.isPending}
                    >
                      <ArrowLeft className="size-3.5 mr-1" />
                      Cambiar actividad
                    </Button>
                    {/* Va en la barra sticky y no solo al pie de la página
                        porque con 25 expedientes la barra es lo único que se
                        ve sin scrollear: es donde el operador se da cuenta de
                        que está armando el lote equivocado. */}
                    <StartOverButton
                      fileCount={files.length}
                      programLabel={programLabel ?? null}
                      activityName={activity?.name ?? null}
                      onClearFiles={handleClearFiles}
                      onResetAll={handleResetAll}
                      disabled={createBatch.isPending}
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      2
                    </span>
                    <div>
                      <h2 className="font-heading text-base font-semibold text-foreground">
                        Archivos del lote
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Tomalos de Google Drive. Después revisá los expedientes y
                        corregí lo que haga falta.
                      </p>
                    </div>
                  </div>
                  <GoogleDrivePicker
                    fileCount={files.length}
                    onPick={handlePick}
                    disabled={createBatch.isPending}
                    ref={drivePickerRef}
                  />
                </div>

                {files.length > 0 && (
                  <>
                    {/* Estado del lote en una línea. Es la respuesta a la
                        pregunta que el operador se hace primero —¿qué se va a
                        subir?— y antes solo se respondía con un toast de cuatro
                        segundos o con el conteo enterrado en "N archivos
                        seleccionados". */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-border bg-muted/40 px-3.5 py-2 font-data text-xs">
                      <span>
                        <strong className="text-base text-foreground">
                          {files.length}
                        </strong>{' '}
                        <span className="text-muted-foreground">seleccionados</span>
                      </span>
                      <span className="h-3 w-px bg-border" />
                      <span>
                        <strong className="text-base text-success-dark">
                          {fileValidation.validCount}
                        </strong>{' '}
                        <span className="text-muted-foreground">
                          se van a subir
                        </span>
                      </span>
                      {fileValidation.invalidCount > 0 && (
                        <>
                          <span className="h-3 w-px bg-border" />
                          <span>
                            <strong className="text-base text-warning-dark">
                              {fileValidation.invalidCount}
                            </strong>{' '}
                            <span className="text-muted-foreground">
                              sin destino (a la derecha)
                            </span>
                          </span>
                        </>
                      )}
                      <span className="h-3 w-px bg-border" />
                      <span>
                        <strong className="text-base text-foreground">
                          {fileValidation.dossierCount}
                        </strong>{' '}
                        <span className="text-muted-foreground">
                          expedientes
                        </span>
                      </span>
                    </div>

                    <DossierBoard
                      validation={fileValidation}
                      onAssign={handleAssign}
                      onUnassign={handleUnassign}
                      onRemoveFile={handleRemove}
                      canUnassign={handleCanUnassign}
                      onRequestDrive={() => drivePickerRef.current?.openPicker()}
                      disabled={createBatch.isPending}
                    />
                  </>
                )}

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
                    rows={2}
                    className="resize-y"
                    disabled={createBatch.isPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Acompaña al lote durante todo el flujo; es visible en el
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
                      <span className="hidden max-w-72 text-right font-data text-xs font-medium text-destructive sm:block">
                        {files.length === 0
                          ? 'Falta seleccionar archivos de Drive'
                          : fileValidation.validCount === 0
                            ? 'No hay archivos con formato o código válido'
                            : fileValidation.hasIncompleteDossiers
                              ? 'Faltan documentos en algunos expedientes'
                              : 'Falta ingresar la descripción del lote'}
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
    </div>
  );
}
