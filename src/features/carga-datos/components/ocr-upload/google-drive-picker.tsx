'use client';

import { useCallback, useState } from 'react';
import { AlertCircle, FileText, FolderOpen, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PickedFile } from '@/shared/drive/types';
import { CONFIG_ERROR, acquireDriveToken } from '@/shared/drive/drive-auth';
import { CustomDrivePickerModal } from './custom-drive-picker-modal';

interface GoogleDrivePickerProps {
  files: PickedFile[];
  onPick: (files: PickedFile[]) => void;
  onRemove: (sourceId: string) => void;
  disabled?: boolean;
}

export function GoogleDrivePicker({
  files,
  onPick,
  onRemove,
  disabled = false,
}: GoogleDrivePickerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(CONFIG_ERROR);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const handleOpen = useCallback(async () => {
    if (CONFIG_ERROR) {
      setError(CONFIG_ERROR);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await acquireDriveToken();
      setAccessToken(token);
      setIsModalOpen(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo abrir Google Drive.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const hasFiles = files.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {hasFiles ? (
        <ul className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
          {files.map((file) => (
            <li
              key={file.source_id}
              className="flex items-center gap-3.5 rounded-lg border border-success bg-success-light px-4 py-3"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-success-dark">
                <FileText className="size-4" />
              </span>
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {file.file_name}
              </p>
              <button
                type="button"
                onClick={() => onRemove(file.source_id)}
                title="Quitar archivo"
                aria-label={`Quitar ${file.file_name}`}
                disabled={disabled}
                className="flex items-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-error-light hover:text-error disabled:pointer-events-none disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div
          className={cn(
            'flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center'
          )}
        >
          <div className="flex size-13 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <FolderOpen className="size-6" />
          </div>
          <div>
            <p className="text-base font-medium text-foreground">
              Selecciona los documentos desde Google Drive
            </p>
            <p className="mt-1.5 font-data text-xs text-muted-foreground">
              Se abrirá tu Google Drive para elegir uno o varios archivos.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant={hasFiles ? 'outline' : 'default'}
          onClick={handleOpen}
          disabled={disabled || loading || Boolean(CONFIG_ERROR)}
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <FolderOpen />
          )}
          {hasFiles ? 'Agregar más de Drive' : 'Seleccionar de Google Drive'}
        </Button>
        {hasFiles && (
          <span className="font-data text-xs text-muted-foreground">
            {files.length} archivo{files.length === 1 ? '' : 's'} seleccionado
            {files.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive" role="alert">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </p>
      )}

      <CustomDrivePickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        token={accessToken}
        onPick={onPick}
      />
    </div>
  );
}
