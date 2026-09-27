/**
 * Miniaturas de archivos de Drive privados.
 *
 * El visor y la galería de huecos necesitan *mirar* los escaneos, y hay un
 * problema de fondo: la API de Drive retiró `thumbnailLink` (deprecado y
 * eliminado en 2024), así que no hay forma de pedirle a Google una versión
 * reducida. Para un archivo privado solo hay dos caminos: descargar los bytes
 * con `alt=media`, o nada.
 *
 * Descargar los bytes de 141 escaneos de una vez son varios cientos de
 * megabytes y satura el navegador. Este módulo lo resuelve en tres:
 *
 * 1. **Reducir en el cliente.** El blob se decodifica con `createImageBitmap`,
 *    se dibuja en un canvas de 360px de lado mayor y se guarda como JPEG
 *    quality 0.72. Un escaneo de 4.000px de 3MB pasa a ~18KB. El blob
 *    completo se revoca en el acto, así que de los 141 archivos solo quedan
 *    las miniaturas.
 * 2. **No pedir más de 4 a la vez.** El orden de las peticiones a Drive está
 *    acotado; sin esto, abrir la galería dispara 141 requests que compiten por
 *    el ancho de banda y Google responde 429.
 * 3. **Cachear y deduplicar.** El resultado se guarda por `sourceId`, así que
 *    abrir la galería por segunda vez es instantáneo y dos tarjetas del mismo
 *    archivo no descargan dos veces.
 *
 * `createImageBitmap` también resuelve el caso de los archivos que no son
 * imagen (un PDF, un `.heic`): rechaza, y la tarjeta cae al ícono de archivo en
 * vez de quedar en blanco.
 *
 * No pide token: usa `peekDriveToken`, que solo devuelve uno ya concedidos.
 * Una galería que abre una ventana de consentimiento de Google encima de las
 * fotos sería peor que una galería sin fotos.
 */
import { fetchDriveFileBlob } from './drive-api';
import { peekDriveToken } from './drive-auth';

/** Lado mayor de la miniatura. El card mide ~144px; 360 deja nitidez en 2x. */
const MAX_EDGE = 360;
const JPEG_QUALITY = 0.72;
/** Peticiones simultáneas a Drive. */
const MAX_CONCURRENT = 4;
/** Tope del caché. 141 archivos × ~18KB da 2.5MB; el corte es solo para que
 *  el mapa no crezca sin límite en una sesión larga. */
const MAX_CACHE_ENTRIES = 400;

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

let active = 0;
const waiting: Array<() => void> = [];

function acquire(): Promise<void> {
  if (active < MAX_CONCURRENT) {
    active += 1;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => waiting.push(resolve));
}

function release(): void {
  active -= 1;
  waiting.shift()?.();
}

async function toThumbnailDataUrl(blob: Blob): Promise<string> {
  const bitmap = await createImageBitmap(blob);
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Sin canvas 2D.');
    ctx.drawImage(bitmap, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  } finally {
    // Libera la memoria del bitmap decodificado, que es la parte cara: un
    // escaneo de 4.000×3.000 son ~48MB en memoria, y con 141 de estos holders
    // el navegador muere.
    bitmap.close();
  }
}

function remember(sourceId: string, dataUrl: string): void {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(sourceId, dataUrl);
}

/**
 * Miniatura en JPEG como data URL. Reutiliza la caché y deduplica las
 * peticiones en curso. Lanza si no hay sesión de Drive o el archivo no es
 * una imagen.
 */
export function loadDriveThumbnail(sourceId: string): Promise<string> {
  const cached = cache.get(sourceId);
  if (cached) return Promise.resolve(cached);

  const running = inflight.get(sourceId);
  if (running) return running;

  const task = (async () => {
    const token = peekDriveToken();
    if (!token) throw new Error('Sin sesión de Google Drive.');

    await acquire();
    try {
      const blob = await fetchDriveFileBlob(token, sourceId);
      const dataUrl = await toThumbnailDataUrl(blob);
      remember(sourceId, dataUrl);
      return dataUrl;
    } finally {
      release();
    }
  })();

  inflight.set(sourceId, task);
  // La promesa vive en el caché de "en curso" solo mientras corre: si la
  // sacamos al terminar, el siguiente que la pida recibe la miniatura del
  // caché en lugar de una promesa rechazada que ya no tiene consumidor.
  void task.finally(() => inflight.delete(sourceId));
  return task;
}

/** La miniatura si ya se calculó. Permite pintar sin esperar a la red. */
export function peekDriveThumbnail(sourceId: string): string | undefined {
  return cache.get(sourceId);
}
