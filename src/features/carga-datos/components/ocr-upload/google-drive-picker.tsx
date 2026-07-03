'use client';

import { useCallback, useState } from 'react';
import { AlertCircle, FileText, FolderOpen, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { clientEnv } from '@/lib/env';
import { cn } from '@/lib/utils';
import type {
  GapiApi,
  GoogleApi,
  GoogleTokenResponse,
  PickerResponse,
} from '@/types/google-picker';
import type { PickedFile } from '../../types';

const GOOGLE_CLIENT_ID = clientEnv.googleClientId;
const GOOGLE_API_KEY = clientEnv.googleApiKey;

/** Drive completo del usuario en modo lectura: suficiente para navegar y elegir. */
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

/**
 * El App ID del Picker es el número de proyecto de Google Cloud, que coincide
 * con el prefijo numérico del Client ID (p. ej. `732112449971-xxxx.apps...`).
 */
const GOOGLE_APP_ID = GOOGLE_CLIENT_ID?.split('-')[0] ?? '';

const GAPI_SCRIPT_ID = 'google-api-js';
const GAPI_SCRIPT_SRC = 'https://apis.google.com/js/api.js';
// Mismo id que usa el login: si el script ya está en la página, se reutiliza.
const GSI_SCRIPT_ID = 'google-identity-services-script';
const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

/** `window.google` está tipado de forma acotada por el login; lo ampliamos aquí. */
function getGoogleApi(): GoogleApi | undefined {
  return (window as unknown as { google?: GoogleApi }).google;
}

/**
 * Carga un script externo una sola vez. `isReady` evita esperar el evento `load`
 * cuando la librería ya está disponible (p. ej. el GSI cargado por el login).
 */
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

/** Carga `gapi` y su módulo `picker` (deja disponible `google.picker`). */
async function ensurePicker(): Promise<void> {
  await loadScript(GAPI_SCRIPT_ID, GAPI_SCRIPT_SRC, () =>
    Boolean(window.gapi)
  );
  await new Promise<void>((resolve, reject) => {
    const gapi: GapiApi | undefined = window.gapi;
    if (!gapi) {
      reject(new Error('La librería de Google (gapi) no está disponible.'));
      return;
    }
    if (getGoogleApi()?.picker) {
      resolve();
      return;
    }
    gapi.load('picker', () => resolve());
  });
}

/** Carga Google Identity Services (oauth2) para pedir el access token. */
async function ensureIdentityServices(): Promise<void> {
  await loadScript(GSI_SCRIPT_ID, GSI_SCRIPT_SRC, () =>
    Boolean(getGoogleApi()?.accounts?.oauth2)
  );
}

/**
 * Token de Drive cacheado en memoria durante la sesión. El usuario solo concede
 * el permiso de Drive la primera vez; mientras el token siga vigente reabrimos el
 * Picker sin volver a pedir cuenta/consentimiento.
 */
let cachedToken: { value: string; expiresAt: number } | null = null;

/** Margen de seguridad para renovar antes de que el token expire de verdad. */
const TOKEN_EXPIRY_MARGIN_MS = 60_000;

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
        cachedToken = {
          value: response.access_token,
          expiresAt: Date.now() + ttlMs - TOKEN_EXPIRY_MARGIN_MS,
        };
        resolve(response.access_token);
      },
      error_callback: (error) =>
        reject(
          new Error(error.message ?? 'Se canceló la autorización de Drive.')
        ),
    });
    // `prompt: ''` deja que Google omita la pantalla de cuenta/consentimiento
    // cuando el permiso ya fue concedido en una sesión anterior.
    client.requestAccessToken({ prompt: '' });
  });
}

/** Devuelve el token cacheado si sigue vigente; si no, pide uno nuevo. */
function getDriveToken(google: GoogleApi): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return Promise.resolve(cachedToken.value);
  }
  return requestDriveToken(google);
}

async function fetchFolderContents(
  folderId: string,
  token: string
): Promise<PickedFile[]> {
  try {
    const query = `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`;
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        query
      )}&fields=files(id,name)&pageSize=1000`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok) throw new Error('Error al listar archivos de la carpeta');
    const data = await res.json();
    return (data.files || []).map((f: { id: string; name: string }) => ({
      source_id: f.id,
      file_name: f.name,
    }));
  } catch (err) {
    console.error('Error fetching folder contents:', err);
    return [];
  }
}

/** Construye y muestra el Picker; resuelve los docs elegidos vía `onPicked`. */
function openDrivePicker(
  google: GoogleApi,
  token: string,
  onPicked: (files: PickedFile[]) => void,
  setFetchingDocs: (fetching: boolean) => void
): void {
  // Muestra carpetas y permite seleccionarlas
  const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
    .setIncludeFolders(true)
    .setSelectFolderEnabled(true);

  const picker = new google.picker.PickerBuilder()
    .addView(view)
    .setOAuthToken(token)
    .setDeveloperKey(GOOGLE_API_KEY ?? '')
    .setAppId(GOOGLE_APP_ID)
    .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
    .setTitle('Selecciona documentos o carpetas a digitalizar')
    .setCallback(async (response: PickerResponse) => {
      if (response.action !== google.picker.Action.PICKED) return;
      const docs = response.docs ?? [];
      if (docs.length === 0) return;

      setFetchingDocs(true);
      try {
        let finalFiles: PickedFile[] = [];

        for (const doc of docs) {
          const mimeType = (doc as any).mimeType;
          if (mimeType === 'application/vnd.google-apps.folder') {
            // Es una carpeta: extraer sus archivos
            const folderFiles = await fetchFolderContents(doc.id, token);
            finalFiles = finalFiles.concat(folderFiles);
          } else {
            // Es un archivo normal
            finalFiles.push({
              source_id: doc.id,
              file_name: doc.name,
            });
          }
        }

        if (finalFiles.length > 0) {
          onPicked(finalFiles);
        }
      } finally {
        setFetchingDocs(false);
      }
    })
    .build();

  picker.setVisible(true);
}

interface GoogleDrivePickerProps {
  files: PickedFile[];
  /** Recibe los documentos recién elegidos; el padre fusiona y deduplica. */
  onPick: (files: PickedFile[]) => void;
  onRemove: (sourceId: string) => void;
  disabled?: boolean;
}

const CONFIG_ERROR = !GOOGLE_CLIENT_ID
  ? 'Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID.'
  : !GOOGLE_API_KEY
    ? 'Falta configurar NEXT_PUBLIC_GOOGLE_API_KEY para usar el selector de Google Drive.'
    : null;

export function GoogleDrivePicker({
  files,
  onPick,
  onRemove,
  disabled = false,
}: GoogleDrivePickerProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingDocs, setFetchingDocs] = useState(false);
  const [error, setError] = useState<string | null>(CONFIG_ERROR);

  const handleOpen = useCallback(async () => {
    if (CONFIG_ERROR) {
      setError(CONFIG_ERROR);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await Promise.all([ensurePicker(), ensureIdentityServices()]);
      const google = getGoogleApi();
      if (!google?.accounts?.oauth2 || !google.picker) {
        throw new Error('Las APIs de Google no se cargaron correctamente.');
      }
      const token = await getDriveToken(google);
      openDrivePicker(google, token, onPick, setFetchingDocs);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo abrir Google Drive.'
      );
    } finally {
      setLoading(false);
    }
  }, [onPick]);

  const hasFiles = files.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {hasFiles ? (
        <ul className="flex flex-col gap-2">
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
          {loading || fetchingDocs ? (
            <Loader2 className="animate-spin" />
          ) : (
            <FolderOpen />
          )}
          {fetchingDocs
            ? 'Procesando carpeta...'
            : hasFiles
              ? 'Agregar más de Drive'
              : 'Seleccionar de Google Drive'}
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
    </div>
  );
}
