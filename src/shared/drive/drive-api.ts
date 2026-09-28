/**
 * Cliente REST de Google Drive (v3) para navegar y seleccionar archivos. Antes
 * estaba duplicado en `custom-drive-picker-modal.tsx` (carga-datos, multi-select)
 * y en `single-drive-file-picker.tsx` (triaje, single-select). Se centraliza aquí
 * como funciones puras; el estado (historial, selección, loading) sigue en cada
 * modal, que solo difiere en el modelo de selección.
 */
import type { DriveFile, PickedFile } from './types';

const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_DRIVES_URL = 'https://www.googleapis.com/drive/v3/drives';

/** Nodos raíz virtuales: "Mi Unidad" y "Unidades Compartidas". */
export const ROOT_NODES: DriveFile[] = [
  { id: 'root', name: 'Mi Unidad', mimeType: 'application/vnd.google-apps.folder' },
  {
    id: 'shared_drives_root',
    name: 'Unidades Compartidas',
    mimeType: 'application/vnd.google-apps.folder',
    isSharedDrive: true,
  },
];

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Falló la descarga, y el código dice por qué.
 *
 * Antes el mensaje era uno solo para cualquier `!res.ok`, y eso borra
 * justamente el dato que decide qué hacer: un `401` significa que hay que
 * renovar la sesión y un `429` que hay que esperar y reintentar. Con un solo
 * texto los dos se veían igual y los dos quedaban sin salida.
 *
 * El `403` NO se mezcla con el `401` a propósito: `403` casi siempre es que
 * ese archivo en particular no se puede leer, y tirar la sesión ahí
 * expulsaría al operador de Drive por un archivo.
 */
export class DriveHttpError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Google Drive respondió ${status}.`);
    this.name = 'DriveHttpError';
    this.status = status;
  }
}

/**
 * Baja los bytes de un archivo de Drive con el token del usuario.
 *
 * Hace falta para los archivos privados. El proxy `/api/drive-image` va contra
 * `drive.google.com/thumbnail`, que solo responde para archivos públicos
 * ("cualquier persona con el enlace"), así que los escaneos de un Drive
 * privado dan 404 y el operador ve "no se pudo obtener una vista previa" en
 * todos los archivos. Con `alt=media` y el bearer del usuario se leen los
 * privados, y además el token no sale del navegador: no hace falta mandarlo a
 * nuestro servidor para que lo use de puente.
 *
 * `supportsAllDrives` porque los archivos pueden vivir en unidades
 * compartidas, que sin ese parámetro dan 404.
 */
export async function fetchDriveFileBlob(
  token: string,
  fileId: string
): Promise<Blob> {
  const url = new URL(`${DRIVE_FILES_URL}/${fileId}`);
  url.searchParams.append('alt', 'media');
  url.searchParams.append('supportsAllDrives', 'true');

  const res = await fetch(url.toString(), { headers: authHeaders(token) });
  if (!res.ok) throw new DriveHttpError(res.status);
  return res.blob();
}

/**
 * Lista el contenido de una carpeta de Drive. Casos especiales:
 *  - `app_root` → los nodos raíz virtuales (`ROOT_NODES`).
 *  - `shared_drives_root` → las Unidades Compartidas del usuario.
 * `pageSize` varía por consumidor (single: 200, multi: 1000).
 */
export async function listDriveContent(
  token: string,
  folderId: string,
  search = '',
  pageSize = 200
): Promise<DriveFile[]> {
  if (folderId === 'app_root') return ROOT_NODES;

  if (folderId === 'shared_drives_root') {
    const res = await fetch(`${DRIVE_DRIVES_URL}?pageSize=100`, {
      headers: authHeaders(token),
    });
    if (!res.ok) throw new Error('Error al cargar Unidades Compartidas');
    const data = await res.json();
    let drives: DriveFile[] = (data.drives || []).map(
      (d: { id: string; name: string }) => ({
        id: d.id,
        name: d.name,
        mimeType: 'application/vnd.google-apps.folder',
        isSharedDrive: true,
      })
    );
    if (search) {
      drives = drives.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));
    }
    return drives;
  }

  let query = `'${folderId}' in parents and trashed = false`;
  if (search) query += ` and name contains '${search.replace(/'/g, "\\'")}'`;

  // Restringir a carpetas y formatos soportados por Azure Document Intelligence
  const supportedMimes = [
    "'application/vnd.google-apps.folder'",
    "'application/pdf'",
    "'image/jpeg'",
    "'image/png'",
    "'image/tiff'",
    "'image/bmp'",
  ].join(' or mimeType = ');
  
  query += ` and (mimeType = ${supportedMimes})`;

  const url = new URL(DRIVE_FILES_URL);
  url.searchParams.append('q', query);
  url.searchParams.append('fields', 'files(id,name,mimeType,modifiedTime)');
  url.searchParams.append('orderBy', 'folder,name');
  url.searchParams.append('pageSize', String(pageSize));
  url.searchParams.append('supportsAllDrives', 'true');
  url.searchParams.append('includeItemsFromAllDrives', 'true');
  url.searchParams.append('corpora', 'allDrives');

  const res = await fetch(url.toString(), { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Error al cargar archivos de Google Drive');
  const data = await res.json();
  return (data.files || []) as DriveFile[];
}

/**
 * Lista los ARCHIVOS directos (no recursivo en subcarpetas) de una carpeta, ya
 * como `PickedFile[]`. Se usa al confirmar una selección de carpeta en el
 * multi-picker: expande la carpeta a sus archivos. Ante error devuelve `[]`.
 */
export async function listFolderFiles(
  token: string,
  folderId: string
): Promise<PickedFile[]> {
  try {
    const supportedMimes = [
      "'application/pdf'",
      "'image/jpeg'",
      "'image/png'",
      "'image/tiff'",
      "'image/bmp'",
    ].join(' or mimeType = ');

    const query = `'${folderId}' in parents and trashed = false and (mimeType = ${supportedMimes})`;
    const url = new URL(DRIVE_FILES_URL);
    url.searchParams.append('q', query);
    url.searchParams.append('fields', 'files(id,name)');
    url.searchParams.append('pageSize', '1000');
    url.searchParams.append('supportsAllDrives', 'true');
    url.searchParams.append('includeItemsFromAllDrives', 'true');
    url.searchParams.append('corpora', 'allDrives');

    const res = await fetch(url.toString(), { headers: authHeaders(token) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.files || []).map((f: { id: string; name: string }) => ({
      source_id: f.id,
      file_name: f.name,
    }));
  } catch (err) {
    console.error(err);
    return [];
  }
}
