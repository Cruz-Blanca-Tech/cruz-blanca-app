'use client';

import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  FileText,
  FolderOpen,
  Info,
  Loader2,
  RefreshCw,
  X,
  XCircle,
} from 'lucide-react';
import type { PendingDocumentItem } from '../schemas/case-documents-schema';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useUploadMissingDoc } from '../hooks/use-upload-missing-doc';
import { useRevalidateDossier } from '../hooks/use-revalidate-dossier';
import { SingleDrivePickerModal } from './single-drive-file-picker';
import { acquireDriveToken } from '@/shared/drive/drive-auth';
import type { DocumentDossierItem } from '../schemas/case-documents-schema';
import type { PickedFile } from '@/shared/drive/types';

// ─────────────────────────────────────────────────────────────────────────────
// Botón compacto de Drive — abre el modal sin dropzone
// ─────────────────────────────────────────────────────────────────────────────
function CompactDrivePicker({
  onPick,
  disabled,
}: {
  onPick: (file: PickedFile) => void;
  disabled: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const t = await acquireDriveToken();
      setToken(t);
      setIsPickerOpen(true);
    } catch {
      // fallo silencioso — usuario puede reintentar
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 shrink-0 gap-1 text-[11px] px-2.5"
        onClick={handleClick}
        disabled={disabled || loading}
      >
        {loading ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <FolderOpen className="size-3" />
        )}
        {loading ? 'Abriendo...' : 'Seleccionar'}
      </Button>

      {token && (
        <SingleDrivePickerModal
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          token={token}
          onPick={(file) => {
            onPick(file);
            setIsPickerOpen(false);
          }}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────
type Phase = 'idle' | 'uploading' | 'revalidating' | 'success' | 'no_action';

interface DossierDocumentChecklistProps {
  isOpen: boolean;
  onClose: () => void;
  batchId: string;
  caseId: string;
  dniReference: string;
  /**
   * Documentos faltantes calculados por el backend en
   * GET .../documents → pending_documents.
   * El `code` (ej. "DNIAP") es el identificador del tipo de documento.
   */
  pendingDocuments: PendingDocumentItem[];
  onSuccess: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export function DossierDocumentChecklist({
  isOpen,
  onClose,
  batchId,
  caseId,
  dniReference,
  pendingDocuments,
  onSuccess,
}: DossierDocumentChecklistProps) {
  // Mapa code → archivo elegido por el usuario desde Drive
  const [selectedFiles, setSelectedFiles] = useState<Record<string, PickedFile>>({});
  const [phase, setPhase] = useState<Phase>('idle');
  const [uploadingCode, setUploadingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadMutation = useUploadMissingDoc(batchId, dniReference, caseId);
  const revalidateMutation = useRevalidateDossier(batchId, dniReference, caseId);

  const actionablePending = pendingDocuments;

  const pendingWithoutFile = actionablePending.filter((doc) => !selectedFiles[doc.code]);
  const canRevalidate = actionablePending.length > 0 && pendingWithoutFile.length === 0;
  const isBusy = phase === 'uploading' || phase === 'revalidating';

  const handleFilePick = (code: string, file: PickedFile) =>
    setSelectedFiles((prev) => ({ ...prev, [code]: file }));

  const handleFileRemove = (code: string) =>
    setSelectedFiles((prev) => {
      const next = { ...prev };
      delete next[code];
      return next;
    });

  const handleRevalidate = async () => {
    if (!canRevalidate) return;
    setError(null);

    try {
      // ── Paso 1: subir cada documento faltante ──────────────────────────
      setPhase('uploading');
      for (const doc of actionablePending) {
        const code = doc.code;
        const file = selectedFiles[code];
        if (!file) continue;
        setUploadingCode(code);
        const ext = file.file_name.split('.').pop() || 'pdf';
        await uploadMutation.mutateAsync({
          document_code: code,
          file: {
            file_name: `${dniReference}_${code}.${ext}`,
            source_id: file.source_id,
          },
        });
      }
      setUploadingCode(null);

      // ── Paso 2: solicitar re-validación ────────────────────────────────
      setPhase('revalidating');
      const result = await revalidateMutation.mutateAsync();

      if (result.status === 'NO_ACTION_NEEDED') {
        setPhase('no_action');
      } else {
        setPhase('success');
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar. Intenta de nuevo.');
      setPhase('idle');
      setUploadingCode(null);
    }
  };

  // ── Pantallas terminales (éxito / sin acción) ─────────────────────────────
  if (phase === 'success' || phase === 'no_action') {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="!w-[380px] !max-w-[95vw] bg-white p-0 gap-0">
          <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
            {phase === 'success' ? (
              <>
                <CheckCircle2 className="size-10 text-success-dark" />
                <p className="text-sm font-semibold text-foreground">
                  Documentos enviados correctamente
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  El motor de triaje está evaluando el expediente en segundo plano.
                  El estado se actualizará automáticamente.
                </p>
              </>
            ) : (
              <>
                <Info className="size-10 text-primary" />
                <p className="text-sm font-semibold text-foreground">
                  Sin cambios pendientes
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Todos los documentos ya estaban presentes. No se realizó ninguna acción.
                </p>
              </>
            )}
            <Button size="sm" className="mt-1 h-8 text-xs" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Vista principal ───────────────────────────────────────────────────────
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isBusy && onClose()}>
      <DialogContent className="!w-[400px] !max-w-[95vw] bg-white p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="text-sm font-semibold">
            Documentos faltantes
          </DialogTitle>
          <DialogDescription className="text-xs mt-0.5 leading-snug">
            <span className="font-mono font-medium text-foreground">{dniReference}</span>
            {actionablePending.length > 0
              ? ` · ${actionablePending.length} documento${actionablePending.length > 1 ? 's' : ''} por subir`
              : ' · Sin documentos pendientes'}
          </DialogDescription>
        </DialogHeader>

        {/* Lista */}
        <div className="px-4 py-3 flex flex-col gap-1.5">
          {actionablePending.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No hay documentos faltantes para este expediente.
            </p>
          ) : (
            actionablePending.map((doc) => {
              const code = doc.code;
              const name = doc.name || code;
              const picked = selectedFiles[code] ?? null;
              const isUploadingThis = phase === 'uploading' && uploadingCode === code;

              return (
                <div
                  key={code}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md border px-3 py-2 text-xs transition-colors',
                    picked
                      ? 'border-primary/25 bg-brand-50'
                      : 'border-border bg-white'
                  )}
                >
                  {/* Ícono estado */}
                  {isUploadingThis ? (
                    <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
                  ) : picked ? (
                    <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
                  ) : (
                    <XCircle className="size-3.5 shrink-0 text-error" />
                  )}

                  {/* Nombre del tipo de documento */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground leading-tight">
                      {name}
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground">{code}</p>
                  </div>

                  {/* Acción derecha */}
                  {isUploadingThis ? (
                    <span className="shrink-0 text-[10px] text-primary animate-pulse">
                      Subiendo...
                    </span>
                  ) : picked ? (
                    <div className="flex items-center gap-1 min-w-0 max-w-[130px] shrink-0">
                      <FileText className="size-3 shrink-0 text-primary" />
                      <span className="truncate text-[10px] text-foreground">
                        {picked.file_name}
                      </span>
                      {!isBusy && (
                        <button
                          type="button"
                          onClick={() => handleFileRemove(code)}
                          className="shrink-0 p-0.5 text-muted-foreground hover:text-error rounded"
                        >
                          <X className="size-2.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <CompactDrivePicker
                      onPick={(file) => handleFilePick(code, file)}
                      disabled={isBusy}
                    />
                  )}
                </div>
              );
            })
          )}

          {/* Resumen */}
          {actionablePending.length > 0 && phase === 'idle' && (
            <p className={cn('text-[10.5px] px-1 mt-0.5', canRevalidate ? 'text-primary-dark' : 'text-warning-dark')}>
              {canRevalidate
                ? `✓ Listo para enviar ${actionablePending.length} documento${actionablePending.length > 1 ? 's' : ''}.`
                : `${pendingWithoutFile.length} faltante${pendingWithoutFile.length > 1 ? 's' : ''} sin archivo seleccionado.`}
            </p>
          )}

          {/* Fase: subiendo */}
          {phase === 'uploading' && (
            <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-brand-50 px-3 py-2 text-[11px] text-primary-dark mt-1">
              <Loader2 className="size-3.5 animate-spin shrink-0" />
              Subiendo {uploadingCode}...
            </div>
          )}

          {/* Fase: solicitando re-validación */}
          {phase === 'revalidating' && (
            <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-brand-50 px-3 py-2 text-[11px] text-primary-dark mt-1">
              <Loader2 className="size-3.5 animate-spin shrink-0" />
              Solicitando re-validación al motor de triaje...
            </div>
          )}

          {error && <p className="text-[11px] text-error px-1 mt-1">{error}</p>}
        </div>

        {/* Footer */}
        <DialogFooter className="px-4 pb-4 pt-2 border-t border-border flex-row justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={onClose}
            disabled={isBusy}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={handleRevalidate}
            disabled={!canRevalidate || isBusy}
          >
            {isBusy ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                {phase === 'uploading' ? `Subiendo ${uploadingCode ?? ''}...` : 'Validando...'}
              </>
            ) : (
              <>
                <RefreshCw className="size-3" />
                Re-validar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
