/**
 * Normaliza una URL de Google Drive para poder embeberla en un `<img>`/`<Image>`.
 *
 * Embeber Drive directamente falla: `uc?export=view` responde 403 y el endpoint
 * `thumbnail` / `lh3.googleusercontent.com` es throttleado por Google con 429 al
 * hacer hotlink desde el navegador. Por eso apuntamos a nuestro propio proxy
 * (`/api/drive-image`), que baja la imagen del lado del servidor y la cachea.
 *
 * Si no se reconoce un file id de Drive, se devuelve la URL original intacta.
 *
 * Vive en `src/lib` (ubicación neutra) porque lo consumen dos features:
 * `carga-datos` (catálogo de documentos) y `triaje` (visor de la corrección).
 */
const DRIVE_ID_PATTERNS: RegExp[] = [
  /[?&]id=([\w-]+)/, // uc?export=view&id=ID  ·  thumbnail?id=ID
  /\/file\/d\/([\w-]+)/, // /file/d/ID/view
  /\/d\/([\w-]+)/, // googleusercontent.com/d/ID
];

export function toDriveThumbnailUrl(
  url: string | null,
  size = 'w1000'
): string | null {
  if (!url) return url;
  if (
    !url.includes('drive.google.com') &&
    !url.includes('googleusercontent.com')
  ) {
    return url;
  }

  for (const pattern of DRIVE_ID_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      return `/api/drive-image?id=${match[1]}&sz=${size}`;
    }
  }

  return url;
}
