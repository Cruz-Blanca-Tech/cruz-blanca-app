'use client';

import { useCallback, useState } from 'react';
import { AlertCircle, FolderOpen, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { PickedFile } from '@/shared/drive/types';
import { CONFIG_ERROR, acquireDriveToken } from '@/shared/drive/drive-auth';
import { CustomDrivePickerModal } from './custom-drive-picker-modal';

interface GoogleDrivePickerProps {
  /** Cantidad de archivos ya elegidos; se usa solo para el texto del botón. */
  fileCount: number;
  onPick: (files: PickedFile[]) => void;
  disabled?: boolean;
}

/**
 * Botón para tomar archivos de Google Drive.
 *
 * Antes este componente también renderizaba la lista de archivos elegidos, que
 * con un lote de 233 filas empujaba todo lo demás fuera de la pantalla. Ahora la
 * lista no está: cada archivo vive en el tablero de expedientes o en la
 * bandeja, que es donde se lo puede ver y corregir.
 */
export function GoogleDrivePicker({
  fileCount,
  onPick,
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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant={fileCount > 0 ? 'outline' : 'default'}
          onClick={handleOpen}
          disabled={disabled || loading || Boolean(CONFIG_ERROR)}
        >
          {loading ? <Loader2 className="animate-spin" /> : <FolderOpen />}
          {fileCount > 0 ? 'Agregar más de Drive' : 'Seleccionar de Google Drive'}
        </Button>

        {fileCount === 0 ? (
          <span className="font-data text-xs text-muted-foreground">
            Después vas a ver los expedientes que se forman y vas a poder
            corregir lo que falte.
          </span>
        ) : (
          <span className="font-data text-xs text-muted-foreground">
            {fileCount} archivo{fileCount === 1 ? '' : 's'} en el lote
          </span>
        )}
      </div>

      {error && (
        <p
          className="flex items-center gap-1.5 text-xs text-destructive"
          role="alert"
        >
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
