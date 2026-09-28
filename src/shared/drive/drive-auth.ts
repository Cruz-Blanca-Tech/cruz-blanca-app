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
/**
 * Separador de que el permiso de Drive ya fue concedido en este navegador.
 *
 * Sin este registro no se puede renovar una sesión vencida sin riesgo: el
 * `prompt: ''` de GSI es silencioso **solo si el permiso ya existe**, y si
 * nunca existió cae al flujo interactivo y abre un popup. Guardar que en algún
 * momento se consiguió un token es lo que permite renovar sin ese riesgo: si
 * nunca hubo token, nunca se intenta renovar, y el popup no puede aparecer.
 */
const GRANTED_KEY = 'cruz_blanca_drive_granted';
let memoryToken: { value: string; expiresAt: number } | null = null;
const TOKEN_EXPIRY_MARGIN_MS = 60_000;

/**
 * Renovación en curso, compartida.
 *
 * Sin esto, abrir la galería dispara un `load` por tarjeta y las 20 primeras
 * llegan a la vez: 20 pedidos de token a Google en paralelo. El primero que
 * responde deja a los otros 19 con un token vencido en la mano, que es
 * exactamente el fallo que se está intentando arreglar.
 */
let pendingRenewal: Promise<string | null> | null = null;

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
  try {
    sessionStorage.setItem(GRANTED_KEY, '1');
  } catch {
    // Si no se puede guardar, la sesión en curso anda igual; lo que se pierde
    // es poder renovar más adelante, no el acceso a Drive.
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
 * Token de Drive **solo si ya está en caché**. No pide uno nuevo.
 *
 * Para el visor de documentos: abrir un archivo no puede abrir una ventana de
 * consentimiento de Google en medio de la pantalla de trabajo. `prompt: ''` de
 * GSI es silencioso únicamente si el permiso ya se concedió alguna vez; si
 * nunca se concedió, GSI igual cae al flujo interactivo y salta el popup. Si
 * no hay token no se muestra la imagen —que es lo que pasaba antes, siempre,
 * con Drive privado— pero sin la intromisión. Para volver a tener imágenes el
 * operador tiene que pasar por "Agregar más de Drive", que es donde el permiso
 * se concede y es un momento en que un popup tiene sentido.
 *
 * Las miniaturas y las vistas previas **no** usan esta: usan `renewDriveToken`,
 * que renueva en silencio cuando el permiso ya existe. Con esta, una sesión de
 * una hora vencida dejaba la pantalla sin fotos hasta que el operador volviera
 * a pasar por el selector.
 */
export function peekDriveToken(): string | null {
  const cached = getCachedToken();
  return cached && cached.expiresAt > Date.now() ? cached.value : null;
}

function wasGranted(): boolean {
  try {
    return sessionStorage.getItem(GRANTED_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Olvida la sesión, para que el próximo intento renueve.
 *
 * Se llama cuando Google responde `401`: el token era válido en el papel y
 * dejó de serlo, y sin esto el código de error seguiría en caché y cada
 * reintento fallaría igual para siempre.
 */
export function invalidateDriveToken(): void {
  memoryToken = null;
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Token de Drive, renovado en silencio si hizo falta.
 *
 * Es lo que usan las imágenes, y la diferencia con `peekDriveToken` es toda la
 * diferencia entre una pantalla con fotos y una sin ellas. El token de GSI vive
 * una hora; un lote de 200 escaneos lleva rato. Cuando se vencía, el camino de
 * imágenes recibía `null`, tiraba "Sin sesión de Google Drive" y quedaba
 * muerto: el único modo de recuperar era volver a pasar por "Agregar más de
 * Drive", con el lote entero ya cargado. El selector de archivos, en cambio,
 * siempre renovaba, así que la navegación seguía andando y solo las fotos
 * morían — el síntoma era "las fotos no se ven" sin ninguna pista de por qué.
 *
 * Solo renueva si el permiso ya fue concedido (`GRANTED_KEY`), porque con
 * `prompt: ''` Google abre un popup cuando no hay permiso previo. Si Google
 * revoca el permiso, la renovación falla, se cae el registro y no se vuelve a
 * intentar: reintentar en bucle solo abriría popups.
 *
 * `null` significa que no hay acceso a Drive, y el que llama decide qué
 * mostrándole eso a una persona.
 */
export function renewDriveToken(): Promise<string | null> {
  const cached = peekDriveToken();
  if (cached) return Promise.resolve(cached);
  if (!wasGranted()) return Promise.resolve(null);
  if (pendingRenewal) return pendingRenewal;

  pendingRenewal = (async () => {
    try {
      await ensureIdentityServices();
      const google = getGoogleApi();
      if (!google?.accounts?.oauth2) return null;
      return await requestDriveToken(google);
    } catch {
      // Se renunció, se revocó el permiso o Google no cargó: se olvida que se
      // concedió para no pedir un popup en cada miniatura.
      try {
        sessionStorage.removeItem(GRANTED_KEY);
      } catch {
        // Ignore storage errors
      }
      return null;
    } finally {
      pendingRenewal = null;
    }
  })();

  return pendingRenewal;
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
