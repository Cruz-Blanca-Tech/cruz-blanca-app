'use client';

import { useMemo, useState } from 'react';
import { FileText, Loader2, X } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useBatch } from '../hooks/use-triaje-queries';
import { useActivities } from '@/shared/hooks/use-intake-queries';
import { useDocumentCatalog } from '@/features/carga-datos/hooks/use-carga-datos-queries';
import { useUploadMissingDoc } from '../hooks/use-upload-missing-doc';
import type { PickedFile } from '@/shared/drive/types';
import { SingleDriveFilePicker } from './single-drive-file-picker';

interface UploadMissingDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchId: string;
  dniReference: string;
}

export function UploadMissingDocModal({
  isOpen,
  onClose,
  batchId,
  dniReference,
}: UploadMissingDocModalProps) {
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);

  const batchQuery = useBatch(batchId);
  const activityId = batchQuery.data?.activity_id ?? null;

  // Cargamos TODAS las actividades (sin filtrar por programa) y luego
  // buscamos la que corresponde al lote. El batch solo expone activity_id,
  // no program_id, así que no podemos pre-filtrar.
  const activitiesQuery = useActivities(null, isOpen);
  const catalogQuery = useDocumentCatalog(isOpen && Boolean(activityId));

  const uploadMutation = useUploadMissingDoc(batchId, dniReference);

  // Derivar las opciones del select dinámicamente según la actividad
  const documentOptions = useMemo(() => {
    if (!activitiesQuery.data || !catalogQuery.data || !activityId) return [];

    const activity = activitiesQuery.data.find((a) => a.id === activityId);
    if (!activity) return [];

    const catalogById = new Map(catalogQuery.data.map((c) => [c.id, c]));

    return activity.requirements.map((req) => {
      const doc = catalogById.get(req.document_type_config_id);
      return {
        code: doc?.code ?? '',
        name: doc?.name ?? 'Documento',
      };
    }).filter(doc => doc.code !== '');
  }, [activitiesQuery.data, catalogQuery.data, activityId]);

  const isLoadingData = batchQuery.isLoading || activitiesQuery.isLoading || catalogQuery.isLoading;

  const handlePick = (file: PickedFile) => {
    setPickedFile(file);
  };

  const handleRemoveFile = () => {
    setPickedFile(null);
  };

  const handleSubmit = () => {
    if (!pickedFile || !selectedCode) return;

    // Forjamos el nombre del archivo: {dni}_{codigo}.{extension}
    const ext = pickedFile.file_name.split('.').pop() || 'pdf';
    const forgedFileName = `${dniReference}_${selectedCode}.${ext}`;

    uploadMutation.mutate({
      document_code: selectedCode,
      file: {
        file_name: forgedFileName,
        source_id: pickedFile.source_id,
      },
    }, {
      onSuccess: () => {
        onClose();
        // Reset state
        setPickedFile(null);
        setSelectedCode('');
      }
    });
  };

  // Si abrimos el modal e intentamos cerrar pero está cargando la mutación, bloqueamos.
  const isMutating = uploadMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isMutating && !open && onClose()}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Subir documento faltante</DialogTitle>
          <DialogDescription>
            Selecciona el documento que deseas adjuntar al expediente de {dniReference}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-4">
          <div className="flex flex-col gap-2">
            <Label>Tipo de Documento</Label>
            {isLoadingData ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground h-10 border rounded-md px-3 bg-slate-50">
                <Loader2 className="size-4 animate-spin" /> Cargando tipos...
              </div>
            ) : (
              <Select value={selectedCode} onValueChange={(v) => setSelectedCode(v ?? '')} disabled={isMutating}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un documento..." />
                </SelectTrigger>
                <SelectContent>
                  {documentOptions.map((opt) => (
                    <SelectItem key={opt.code} value={opt.code}>
                      {opt.name} ({opt.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Archivo desde Google Drive</Label>
            {pickedFile ? (
              <div className="flex items-center gap-3 rounded-lg border border-success bg-success-light px-4 py-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-success-dark">
                  <FileText className="size-4" />
                </span>
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {pickedFile.file_name}
                </p>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  disabled={isMutating}
                  className="flex items-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-error-light hover:text-error disabled:pointer-events-none disabled:opacity-50"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <SingleDriveFilePicker onPick={handlePick} disabled={isMutating} />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isMutating}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedCode || !pickedFile || isMutating}>
            {isMutating && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isMutating ? 'Subiendo...' : 'Subir y Procesar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
