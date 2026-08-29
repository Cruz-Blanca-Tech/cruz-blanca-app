/**
 * Autenticación con Google Drive vía Google Identity Services (GSI). Antes este
 * bloque estaba COPIADO verbatim en `carga-datos/.../google-drive-picker.tsx` y
 * en `triaje/.../single-drive-file-picker.tsx` (el propio código lo admitía en un
 * comentario). Se centraliza aquí.
 *
 * Es un módulo cliente (usa `window`/`sessionStorage`): solo se invoca desde
 * componentes `'use client'`.
 */
import { clientEnv } from '@/lib/env';
import type { GoogleApi, GoogleTokenResponse } from '@/types/google-picker';

const GOOGLE_CLIENT_ID = clientEnv.googleClientId;

/** Drive completo del usuario en modo lectura: suficiente para navegar y elegir. */
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

const GSI_SCRIPT_ID = 'google-identity-services-script';
const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

/** Error de configuración (falta el client id) para deshabilitar los pickers. */
export const CONFIG_ERROR = !GOOGLE_CLIENT_ID
  ? 'Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID.'
  : null;

function getGoogleApi(): GoogleApi | undefined {
  return (window as unknown as { google?: GoogleApi }).google;
}

function loadScript(id: string, src: string, isReady: () => boolean): Promise<void> {
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
      }
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function setCachedToken(value: string, expiresAt: number) {
  const tokenObj = { value, expiresAt };
  memoryToken = tokenObj;
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(tokenObj));
  } catch {
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
        reject(new Error(error.message ?? 'Se canceló la autorización de Drive.')),
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

/**
 * Abre la sesión de Drive de punta a punta: carga GSI, valida que la API esté
 * disponible y devuelve un access token (silencioso si ya se concedió el
 * permiso). Centraliza la secuencia que antes duplicaba cada picker en su
 * `handleOpen`.
 */
export async function acquireDriveToken(): Promise<string> {
  await ensureIdentityServices();
  const google = getGoogleApi();
  if (!google?.accounts?.oauth2) {
    throw new Error('Las APIs de Google no se cargaron correctamente.');
  }
  return getDriveToken(google);
}
