'use client';

import { useCallback, useState } from 'react';
import { AlertCircle, FileText, FolderOpen, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { clientEnv } from '@/lib/env';
import { cn } from '@/lib/utils';
import type {
  GoogleApi,
  GoogleTokenResponse,
} from '@/types/google-picker';
import type { PickedFile } from '../../types';
import { CustomDrivePickerModal } from './custom-drive-picker-modal';

const GOOGLE_CLIENT_ID = clientEnv.googleClientId;

/** Drive completo del usuario en modo lectura: suficiente para navegar y elegir. */
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

const GSI_SCRIPT_ID = 'google-identity-services-script';
const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

function getGoogleApi(): GoogleApi | undefined {
  return (window as unknown as { google?: GoogleApi }).google;
}

function loadScript(
  id: string,
  src: string,
  isReady: () => boolean
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('window no disponible'));
      return;
    }
    if (isReady()) {
      resolve();
      return;
    }
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error(`No se pudo cargar ${src}`)),
        { once: true }
      );
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureIdentityServices(): Promise<void> {
  await loadScript(GSI_SCRIPT_ID, GSI_SCRIPT_SRC, () =>
    Boolean(getGoogleApi()?.accounts?.oauth2)
  );
}

const SESSION_STORAGE_KEY = 'cruz_blanca_drive_token';
let memoryToken: { value: string; expiresAt: number } | null = null;
const TOKEN_EXPIRY_MARGIN_MS = 60_000;

function getCachedToken(): { value: string; expiresAt: number } | null {
  if (memoryToken) return memoryToken;
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.expiresAt > Date.now()) {
        memoryToken = parsed;
        return parsed;
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  } catch (e) {
    // Ignore parse errors
  }
  return null;
}

function setCachedToken(value: string, expiresAt: number) {
  const tokenObj = { value, expiresAt };
  memoryToken = tokenObj;
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(tokenObj));
  } catch (e) {
    // Ignore storage errors (e.g. incognito mode restrictions)
  }
}

/** Pide un access token de Drive (silencioso si ya se concedió el permiso). */
function requestDriveToken(google: GoogleApi): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID ?? '',
      scope: DRIVE_SCOPE,
      callback: (response: GoogleTokenResponse) => {
        if (response.error || !response.access_token) {
          reject(
            new Error(
              response.error_description ??
                response.error ??
                'No se concedió acceso a Google Drive.'
            )
          );
          return;
        }
        const ttlMs = (response.expires_in ?? 3600) * 1000;
        setCachedToken(response.access_token, Date.now() + ttlMs - TOKEN_EXPIRY_MARGIN_MS);
        resolve(response.access_token);
      },
      error_callback: (error) =>
        reject(
          new Error(error.message ?? 'Se canceló la autorización de Drive.')
        ),
    });
    client.requestAccessToken({ prompt: '' });
  });
}

/** Devuelve el token cacheado si sigue vigente; si no, pide uno nuevo. */
function getDriveToken(google: GoogleApi): Promise<string> {
  const cached = getCachedToken();
  if (cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.value);
  }
  return requestDriveToken(google);
}

interface GoogleDrivePickerProps {
  files: PickedFile[];
  onPick: (files: PickedFile[]) => void;
  onRemove: (sourceId: string) => void;
  disabled?: boolean;
}

const CONFIG_ERROR = !GOOGLE_CLIENT_ID
  ? 'Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID.'
  : null;

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
      await ensureIdentityServices();
      const google = getGoogleApi();
      if (!google?.accounts?.oauth2) {
        throw new Error('Las APIs de Google no se cargaron correctamente.');
      }
      const token = await getDriveToken(google);
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
