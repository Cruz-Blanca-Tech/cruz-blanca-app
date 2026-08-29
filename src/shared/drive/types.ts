/**
 * Tipos compartidos de la integración con Google Drive (selección de archivos).
 * Viven en `@/shared/drive` porque los consumen dos features (`carga-datos` y
 * `triaje`); antes `PickedFile` colgaba de `carga-datos/types` y `triaje` lo
 * importaba cruzando la frontera de feature.
 */

/**
 * Archivo seleccionado en el picker de Drive, ya en el formato que espera el
 * backend. `source_id` es el id crudo del archivo en Drive (`doc.id`) y
 * `file_name` su nombre (`doc.name`).
 */
export interface PickedFile {
  source_id: string;
  file_name: string;
}

/** Nodo (archivo o carpeta) tal como lo devuelve la API de Drive. */
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  isSharedDrive?: boolean;
}

/** Migaja de la ruta de navegación dentro del árbol de Drive. */
export interface DriveBreadcrumb {
  id: string;
  name: string;
}
