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
 * No pide token: usa `peekDriveToken`, que solo devuelve uno ya concedidos.
 * Una galería que abre una ventana de consentimiento de Google encima de las
 * fotos sería peor que una galería sin fotos.
 */
import { fetchDriveFileBlob } from './drive-api';
import { peekDriveToken } from './drive-auth';

/** Peticiones simultáneas a Drive. Compartidas por los dos tamaños. */
const MAX_CONCURRENT = 4;

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
  const bitmap = await createImageBitmap(blob);
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
  load: (sourceId: string) => Promise<string>;
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

  return {
    load(sourceId: string): Promise<string> {
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
          const dataUrl = await renderToDataUrl(blob, maxEdge, quality);
          remember(sourceId, dataUrl);
          return dataUrl;
        } finally {
          release();
        }
      })();

      inflight.set(sourceId, task);
      // La promesa vive en el caché de "en curso" solo mientras corre: si la
      // sacamos al terminar, el siguiente que la pida recibe la imagen del
      // caché en lugar de una promesa rechazada que ya no tiene consumidor.
      void task.finally(() => inflight.delete(sourceId));
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
export function loadDriveThumbnail(sourceId: string): Promise<string> {
  return thumbnails.load(sourceId);
}

/** La miniatura si ya se calculó. Permite pintar sin esperar a la red. */
export function peekDriveThumbnail(sourceId: string): string | undefined {
  return thumbnails.peek(sourceId);
}

/** El archivo a tamaño de revisión, para el panel de vista previa. */
export function loadDrivePreview(sourceId: string): Promise<string> {
  return previews.load(sourceId);
}

/** La vista previa si ya se calculó. */
export function peekDrivePreview(sourceId: string): string | undefined {
  return previews.peek(sourceId);
}
