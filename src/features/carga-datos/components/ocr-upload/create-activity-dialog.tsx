'use client';

import { useEffect, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check, FolderPlus, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

import {
  createActivitySchema,
  DEFAULT_CONFIDENCE_THRESHOLD,
  type CreateActivityFormValues,
} from '../../schemas/create-activity-schema';
import { usePrograms } from '@/shared/hooks/use-intake-queries';
import {
  useCreateActivity,
  useDocumentCatalog,
} from '../../hooks/use-carga-datos-queries';
import { useCargaDatosStore } from '../../stores/carga-datos-store';
import { useIsAdmin } from '@/features/auth/hooks/use-permissions';
import type { Activity } from '@/shared/schemas/activity-schema';
import type { CreateActivityRequest } from '../../types';
import { DocumentRow } from './document-row';
import { DocumentZoomDialog, type ZoomTarget } from './document-zoom-dialog';

interface CreateActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se invoca con la actividad creada para seleccionarla automáticamente. */
  onCreated?: (activity: Activity) => void;
}

const EMPTY_FORM: CreateActivityFormValues = { name: '', documents: [] };

export function CreateActivityDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateActivityDialogProps) {
  const selectedProgramId = useCargaDatosStore((s) => s.selectedProgramId);
  const isAdmin = useIsAdmin();

  const programs = usePrograms();
  const documentCatalog = useDocumentCatalog(open && isAdmin);
  const createActivity = useCreateActivity();

  const [zoom, setZoom] = useState<ZoomTarget | null>(null);

  const programName = programs.data?.find(
    (p) => p.id === selectedProgramId
  )?.name;

  const form = useForm<CreateActivityFormValues>({
    resolver: zodResolver(createActivitySchema),
    defaultValues: EMPTY_FORM,
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'documents',
  });

  // Catálogo indexado por id para resolver código/año/imagen de cada fila.
  const catalogById = new Map(
    (documentCatalog.data ?? []).map((doc) => [doc.id, doc])
  );

  // Cuando el modal abre y llega el catálogo, inicializa el formulario.
  useEffect(() => {
    if (open && documentCatalog.data) {
      form.reset({
        name: '',
        documents: documentCatalog.data.map((doc) => ({
          document_type_config_id: doc.id,
          name: doc.name,
          selected: false,
          confidence_threshold: DEFAULT_CONFIDENCE_THRESHOLD,
        })),
      });
    }
  }, [open, documentCatalog.data, form]);

  const watchedDocuments = useWatch({ control: form.control, name: 'documents' });
  const selectedCount =
    watchedDocuments?.filter((doc) => doc.selected).length ?? 0;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset(EMPTY_FORM);
      createActivity.reset();
      setZoom(null);
    }
    onOpenChange(next);
  };

  const onSubmit = form.handleSubmit((values) => {
    if (!selectedProgramId || !isAdmin) return;

    const payload: CreateActivityRequest = {
      name: values.name.trim(),
      is_active: true,
      program_id: selectedProgramId,
      requirements: values.documents
        .filter((doc) => doc.selected)
        .map((doc) => ({
          document_type_config_id: doc.document_type_config_id,
          is_required: true,
          confidence_threshold: doc.confidence_threshold,
        })),
    };

    createActivity.mutate(payload, {
      onSuccess: (activity) => {
        onCreated?.(activity);
        handleOpenChange(false);
      },
    });
  });

  const documentsError = form.formState.errors.documents as
    | { message?: string; root?: { message?: string } }
    | undefined;
  const documentsErrorMessage =
    documentsError?.message ?? documentsError?.root?.message;

  const isLoadingCatalog = documentCatalog.isLoading;
  const hasProgram = Boolean(selectedProgramId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-[620px]">
        <DialogHeader className="flex-row items-center gap-2.5 border-b border-border p-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
            <FolderPlus className="size-4" />
          </span>
          <div className="flex flex-col gap-0.5">
            <DialogTitle>Crear actividad nueva</DialogTitle>
            <DialogDescription className="font-data text-xs">
              {programName ? (
                <>
                  Programa: <strong className="font-medium">{programName}</strong>
                </>
              ) : (
                'Selecciona un programa para continuar.'
              )}
            </DialogDescription>
          </div>
        </DialogHeader>

        {!isAdmin ? (
          <div className="m-4 flex items-center gap-2 rounded-lg bg-warning-light px-3 py-2.5 text-sm text-warning-dark">
            <AlertCircle className="size-4 shrink-0" />
            <span>No tienes permisos para crear actividades.</span>
          </div>
        ) : !hasProgram ? (
          <div className="m-4 flex items-center gap-2 rounded-lg bg-warning-light px-3 py-2.5 text-sm text-warning-dark">
            <AlertCircle className="size-4 shrink-0" />
            <span>Selecciona un programa antes de crear una actividad.</span>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col">
            <div className="flex flex-col gap-4 p-4">
              {/* Nombre */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="activity-name">
                  Nombre de la actividad{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="activity-name"
                  placeholder="Ej. EDUCA 2026-1"
                  className="h-10"
                  aria-invalid={Boolean(form.formState.errors.name)}
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Documentos */}
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2">
                  <Label>
                    Documentos obligatorios{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <span className="font-data text-xs text-muted-foreground">
                    {selectedCount} seleccionado{selectedCount === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="font-data text-xs leading-relaxed text-muted-foreground">
                  Marca los documentos que debe contener el expediente. Para cada
                  uno define el <strong className="font-medium">umbral de
                  confianza</strong>: si el OCR lo supera, el documento se aprueba
                  automáticamente; por debajo, pasa a corrección manual.
                </p>

                {isLoadingCatalog ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Cargando catálogo de documentos…
                  </div>
                ) : documentCatalog.isError ? (
                  <p className="text-sm text-destructive">
                    No se pudo cargar el catálogo de documentos.
                  </p>
                ) : fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay tipos de documento disponibles.
                  </p>
                ) : (
                  <ScrollArea className="max-h-[320px]">
                    <ul className="flex flex-col gap-2 pr-3">
                      {fields.map((field, index) => {
                        const catalog = catalogById.get(
                          field.document_type_config_id
                        );
                        return (
                          <DocumentRow
                            key={field.id}
                            index={index}
                            name={field.name}
                            catalog={catalog}
                            control={form.control}
                            thresholdError={
                              form.formState.errors.documents?.[index]
                                ?.confidence_threshold?.message
                            }
                            onZoom={() =>
                              setZoom({
                                name: field.name,
                                code: catalog?.code ?? '—',
                                previewImageUrl:
                                  catalog?.preview_image_url ?? null,
                              })
                            }
                          />
                        );
                      })}
                    </ul>
                  </ScrollArea>
                )}

                {documentsErrorMessage && (
                  <p className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="size-3.5" />
                    {documentsErrorMessage}
                  </p>
                )}
              </div>

              {createActivity.isError && (
                <div className="flex items-center gap-2 rounded-lg bg-error-light px-3 py-2.5 text-sm text-error-dark">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{createActivity.error.message}</span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={createActivity.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createActivity.isPending || isLoadingCatalog}
              >
                {createActivity.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Crear actividad
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>

      {/* Zoom de documento de ejemplo */}
      <DocumentZoomDialog zoom={zoom} onClose={() => setZoom(null)} />
    </Dialog>
  );
}

