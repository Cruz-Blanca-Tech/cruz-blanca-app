/**
 * Imágenes de archivos de Drive privados, en el tamaño que hace falta.
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
 *    se dibuja en un canvas y se guarda como JPEG. El blob completo se revoca
 *    en el acto, así que nunca queda retenido.
 * 2. **No pedir más de 4 a la vez.** El orden de las peticiones a Drive está
 *    acotado; sin esto, abrir la galería dispara 141 requests que compiten por
 *    el ancho de banda y Google responde 429.
 * 3. **Cachear y deduplicar.** El resultado se guarda por `sourceId`, así que
 *    abrir la galería por segunda vez es instantáneo y dos tarjetas del mismo
 *    archivo no descargan dos veces.
 *
 * Hay dos tamaños, porque son dos preguntas distintas: la miniatura responde
 * *"¿qué documento es esto?"* y la vista previa responde *"¿es el de esta
 * persona?"*, que es la que de verdad importa y necesita más resolución que
 * la que entra en una tarjeta de 150px.
 *
 * `createImageBitmap` también resuelve el caso de los archivos que no son
 * imagen (un PDF, un `.heic`): rechaza, y la tarjeta cae al ícono de archivo en
 * vez de quedar en blanco.
 *
 * No pide token: usa `renewDriveToken`, que renueva en silencio el token
 * vencido si el permiso de Drive ya existe. Una galería que abra una ventana de
 * consentimiento de Google encima de las fotos sería peor que una galería sin
 * fotos, y por eso solo se renueva cuando el permiso ya está concedido.
 */
import { fetchDriveFileBlob, DriveHttpError } from './drive-api';
import { invalidateDriveToken, renewDriveToken } from './drive-auth';

/** Peticiones simultáneas a Drive. Compartidas por los dos tamaños. */
const MAX_CONCURRENT = 4;

/**
 * Por qué no se pudo mostrar la imagen.
 *
 * Antes toda falla terminaba en el mismo texto, y ese texto mentía: decía que
 * el archivo no se podía ver cuando muchas veces lo que no se podía era
 * acceder a él. Con la razón atada al error, cada pantalla puede decir la
 * verdad y ofrecer lo que corresponde —renovar, reintentar o nada— en vez de
 * rendirse siempre con lo mismo.
 */
export type ImageFailure =
  /** No hay acceso a Drive: permiso nunca concedido, o revocado. */
  | 'session'
  /** Google no respondió bien: límite de pedidos o un 5xx. Vale reintentar. */
  | 'transient'
  /** El archivo no es una imagen que el navegador pueda dibujar. */
  | 'unrenderable'
  /** Cualquier otra cosa, incluido un 403 de ese archivo en particular. */
  | 'other';

export class DriveImageError extends Error {
  readonly failure: ImageFailure;

  constructor(failure: ImageFailure, detail?: string) {
    super(detail ?? failure);
    this.name = 'DriveImageError';
    this.failure = failure;
  }
}

/** Traduce cualquier excepción a la razón que la pantalla necesita. */
export function failureOf(err: unknown): ImageFailure {
  if (err instanceof DriveImageError) return err.failure;
  if (err instanceof DriveHttpError) {
    // 429 es límite de pedidos y 5xx es el servidor: los dos son de los que se
    // resuelven solos si se espera un momento.
    if (err.status === 429 || err.status >= 500) return 'transient';
    return 'other';
  }
  // Un `TypeError` es que el `fetch` no llegó a tener respuesta: se cortó la
  // conexión o el navegador quedó sin red. También transitorio, y el caso más
  // común cuando la sesión del navegador expiró.
  if (err instanceof TypeError) return 'transient';
  return 'other';
}

/**
 * Extensiones que el navegador no sabe decodificar.
 *
 * `.pdf` está en `SUPPORTED_EXTENSIONS` del lote y un escaner puede entregar
 * `.tiff`, así que los dos llegan acá. `createImageBitmap` los rechaza siempre,
 * así que bajarlos es gastar megabytes de Google en un descarte: un PDF de una
 * hoja son 5 a 20MB, y con la galería pidiendo 4 a la vez, un lote con PDF
 * satura el ancho de banda, Google responde 429 y ahí fallan también los JPEG,
 * que sí se podían mostrar. Por eso se descartan **antes** de descargar.
 */
const UNRENDERABLE_EXTENSIONS = new Set(['pdf', 'tif', 'tiff', 'heic', 'heif']);

function isUnrenderable(fileName: string): boolean {
  const dot = fileName.lastIndexOf('.');
  if (dot < 0) return false;
  return UNRENDERABLE_EXTENSIONS.has(fileName.slice(dot + 1).toLowerCase());
}

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
  // El permiso se *transfiere* al que estaba esperando, no se devuelve y se
  // entrega otro. Bajar el contador y despertar a un espera al mismo tiempo
  // hacía que `active` fuera cada vez menor que la realidad, y como la
  // comprobación es `active < MAX_CONCURRENT`, el contador inflado hacía que
  // todo lo que llegara después entrara sin esperar: el primer lote respeta
  // el tope de 4 y el segundo se va entero en paralelo. Con 141 escaneos
  // eso es la descarga completa del lote de una, que es justo el 429 que
  // el tope existe para evitar.
  const next = waiting.shift();
  if (next) next();
  else active -= 1;
}

async function renderToDataUrl(
  blob: Blob,
  maxEdge: number,
  quality: number
): Promise<string> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    // El archivo llegó entero pero no es una imagen que el navegador sepa
    // dibujar. No es un problema de red y reintentar no lo arregla.
    throw new DriveImageError(
      'unrenderable',
      'El navegador no puede decodificar este archivo.'
    );
  }
  try {
    // `Math.min(1, ...)`: un archivo chico se guarda tal cual, sin estirar.
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Sin canvas 2D.');
    ctx.drawImage(bitmap, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    // Libera la memoria del bitmap decodificado, que es la parte cara: un
    // escaneo de 4.000×3.000 son ~48MB en memoria, y con 141 de estos holders
    // el navegador muere.
    bitmap.close();
  }
}

interface ImageLoader {
  load: (sourceId: string, fileName?: string) => Promise<string>;
  peek: (sourceId: string) => string | undefined;
}

/**
 * Un tamaño con su propio caché.
 *
 * Los dos tamaños se cachean aparte a propósito: si el de la vista previa
 * metiera su data URL de 500KB en el mismo mapa que las miniaturas, bastarían
 * unas cuantas previsualizaciones para que la grilla se volviera carísima en
 * memoria sin ganar nada.
 */
function createImageLoader({
  maxEdge,
  quality,
  maxEntries,
}: {
  maxEdge: number;
  quality: number;
  maxEntries: number;
}): ImageLoader {
  const cache = new Map<string, string>();
  const inflight = new Map<string, Promise<string>>();

  function remember(sourceId: string, dataUrl: string): void {
    // Evicción FIFO: el corte existe solo para que el mapa no crezca sin
    // límite en una sesión larga.
    if (cache.size >= maxEntries) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    cache.set(sourceId, dataUrl);
  }

  /** Un intento: acceso a Drive, descarga y reducción. */
  async function attempt(sourceId: string): Promise<string> {
    const token = await renewDriveToken();
    if (!token) {
      throw new DriveImageError('session', 'Sin acceso a Google Drive.');
    }

    await acquire();
    try {
      const blob = await fetchDriveFileBlob(token, sourceId);
      return await renderToDataUrl(blob, maxEdge, quality);
    } catch (err) {
      // Un `401` con un token que en el papel estaba vigente significa que
      // Google lo cerró. Va acá y no en el reintento porque un 401 no se
      // reintenta —tampoco es transitorio—: si la conversión viviera más
      // abajo, el `401` saldría como "otro error", la pantalla acusaría al
      // archivo de estar roto y no ofrecería reintentar, que es justo el
      // error que se estaba corrigiendo.
      if (err instanceof DriveHttpError && err.status === 401) {
        invalidateDriveToken();
        throw new DriveImageError('session', 'La sesión de Google venció.');
      }
      throw err;
    } finally {
      release();
    }
  }

  /**
   * El intento, con **un** reintento si la falla fue del momento.
   *
   * Un `429` de Drive no es un fallo del archivo: es que se le pidió rápido.
   * Con 133 miniaturas y 4 en paralelo, un pico de pedidos lo dispara seguido,
   * y sin reintento cada foto que lo pasó quedaba con el mensaje de error para
   * el resto de la sesión. Un reintento con una espera corta lo resuelve; más
   * de uno solo multiplicaría la carga que provocó el 429, así que queda en
   * uno.
   */
  async function fetchAndRender(
    sourceId: string,
    fileName: string
  ): Promise<string> {
    if (isUnrenderable(fileName)) {
      throw new DriveImageError(
        'unrenderable',
        `El navegador no puede mostrar un ${fileName.split('.').pop()}.`
      );
    }

    try {
      return await attempt(sourceId);
    } catch (err) {
      if (failureOf(err) !== 'transient') throw err;

      await new Promise((r) => setTimeout(r, 700));
      return attempt(sourceId);
    }
  }

  return {
    load(sourceId: string, fileName = ''): Promise<string> {
      const cached = cache.get(sourceId);
      if (cached) return Promise.resolve(cached);

      const running = inflight.get(sourceId);
      if (running) return running;

      const task = fetchAndRender(sourceId, fileName).then((dataUrl) => {
        remember(sourceId, dataUrl);
        return dataUrl;
      });

      inflight.set(sourceId, task);
      // La promesa vive en el caché de "en curso" solo mientras corre: si la
      // sacamos al terminar, el siguiente que la pida recibe la imagen del
      // caché en lugar de una promesa rechazada que ya no tiene consumidor.
      //
      // `then` con los dos handlers, y no `finally`: `finally` devuelve una
      // promesa nueva que rechaza con lo mismo, y como nadie la consume queda
      // como rechazo sin manejar. En desarrollo eso es el overlay de Next
      // tapando la pantalla con un error que la aplicación ya sabe manejar —
      // sin sesión de Drive es una condición esperada, no una falla. Con
      // `then` los dos handlers resuelven y la cadena no rechaza; `task`
      // sigue rechazando para el que la pidió, que sí la maneja.
      task.then(
        () => inflight.delete(sourceId),
        () => inflight.delete(sourceId)
      );
      return task;
    },

    peek: (sourceId: string) => cache.get(sourceId),
  };
}

/**
 * Miniatura para la grilla. Lado mayor de 360px: la tarjeta mide ~150px y con
 * eso hay nitidez en pantallas 2x. Un escaneo de 3MB queda en ~18KB.
 *
 * Tope de 400 entradas: con el lote real (141) entra todo, y 141 × 18KB dan
 * 2.5MB.
 */
const thumbnails = createImageLoader({
  maxEdge: 360,
  quality: 0.72,
  maxEntries: 400,
});

/**
 * Vista previa para el panel de revisión.
 *
 * 2.000px de lado mayor, no 360: un A4 vertical de 3.500px queda en 1.414 de
 * ancho, que es lo que hace falta para *leer* el nombre de un DNI en un panel
 * de 360px. Bajarlo a 360 sería pintar un documento ilegible y obligar al
 * operador a adivinar.
 *
 * El tope es chico a propósito: solo hay una foto en pantalla, y cada preview
 * pesa cientos de KB, así que seis entran de sobra para el ida y vuelta.
 */
const previews = createImageLoader({
  maxEdge: 2000,
  quality: 0.8,
  maxEntries: 6,
});

/** Miniatura en JPEG como data URL. Reutiliza caché y deduplica. */
export function loadDriveThumbnail(
  sourceId: string,
  fileName?: string
): Promise<string> {
  return thumbnails.load(sourceId, fileName);
}

/** La miniatura si ya se calculó. Permite pintar sin esperar a la red. */
export function peekDriveThumbnail(sourceId: string): string | undefined {
  return thumbnails.peek(sourceId);
}

/**
 * El archivo a tamaño de revisión, para el panel de vista previa.
 *
 * `fileName` no se reenvía a la ligera: sin él, `isUnrenderable` ve una cadena
 * vacía, no descarta nada, y un PDF del lote baja entero para que
 * `createImageBitmap` lo rechace. Es opcional justamente por eso —el parámetro
 * es un segundo argumento, no un objeto, y por eso es fácil pasarlo por alto al
 * escribir el wrapper—: si se pierde, el descarte se desactiva en silencio.
 */
export function loadDrivePreview(
  sourceId: string,
  fileName?: string
): Promise<string> {
  return previews.load(sourceId, fileName);
}

/** La vista previa si ya se calculó. */
export function peekDrivePreview(sourceId: string): string | undefined {
  return previews.peek(sourceId);
}
