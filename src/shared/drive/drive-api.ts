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
    const query = `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`;
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
