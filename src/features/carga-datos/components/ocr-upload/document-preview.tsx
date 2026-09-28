'use client';

import { ImageOff, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { usePreviewImage } from '@/shared/drive/use-drive-image';

interface DocumentPreviewProps {
  /** Id de Drive del archivo. Vacío = no hay nada que mirar. */
  sourceId: string;
  fileName: string;
  /** Tamaño de la caja. La imagen se adapta con `object-contain`. */
  className?: string;
  /**
   * Qué decir cuando la imagen no se puede mostrar.
   *
   * El texto por defecto es el más corto y sirve para una revisión. Donde la
   * acción sigue disponible igual —la galería, donde el archivo se puede
   * asociar sin haberlo visto— la pantalla pasa una frase propia, porque ahí la
   * falta de imagen no frena nada y decirlo sin más asusta de más.
   */
  failedNote?: string;
}

/**
 * El documento, grande.
 *
 * Vive aparte porque dos pantallas lo necesitan y no pueden divergir: la galería
 * de huecos, para decidir si la foto es la del DNI que falta, y la vista del
 * documento ya asociado, para revisar si es el que corresponde. Las dos
 * comparten el caché de vistas previas, así que pasar de una a otra no vuelve
 * a descargar los 2.000px.
 *
 * `object-contain` y no `cover`: un DNI se reconoce por la foto y por el sello
 * de arriba, y recortar para llenar la caja puede cortar justo lo que había que
 * ver.
 */
export function DocumentPreview({
  sourceId,
  fileName,
  className,
  failedNote = 'No se puede mostrar esta vista previa.',
}: DocumentPreviewProps) {
  const { url, failed } = usePreviewImage(sourceId, Boolean(sourceId));

  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden bg-muted',
        className
      )}
    >
      {url ? (
        /* eslint-disable-next-line @next/next/no-img-element -- data URL ya
            reducida en el cliente; `next/image` solo agregaría una vuelta por el
            optimizador. */
        <img src={url} alt={fileName} className="size-full object-contain" />
      ) : failed ? (
        <div className="flex flex-col items-center gap-1.5 px-4 text-center">
          <ImageOff className="size-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">{failedNote}</p>
        </div>
      ) : (
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
