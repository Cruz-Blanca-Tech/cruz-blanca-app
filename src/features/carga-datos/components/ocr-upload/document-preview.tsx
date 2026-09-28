'use client';

import { ImageOff, Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePreviewImage, type ImageFailure } from '@/shared/drive/use-drive-image';

import { DocumentLightbox } from './document-lightbox';
import { failureCopy } from './image-failure-copy';

interface DocumentPreviewProps {
  /** Id de Drive del archivo. Vacío = no hay nada que mirar. */
  sourceId: string;
  fileName: string;
  /** Tamaño de la caja. La imagen se adapta con `object-contain`. */
  className?: string;
  /**
   * Qué decir cuando el archivo no se puede mostrar como imagen.
   *
   * Es el texto para el caso en que el archivo es el problema —un PDF, un
   * TIFF— y la pantalla donde se muestra la acción sigue disponible igual, así
   * que la falta de imagen no frena nada. Para lo demás no se usa: si lo que
   * falló fue la sesión o la red, el archivo puede estar perfecto y el
   * mensaje tiene que decirlo, porque si no el operador llega a la conclusión
   * de que el archivo está roto y lo saca del lote.
   */
  failedNote?: string;
}

/** Fallos que se pueden volver a pedir. Un PDF de 15MB, no. */
function isWorthRetrying(failure: ImageFailure | undefined): boolean {
  return failure === 'session' || failure === 'transient' || !failure;
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
  const { url, failed, failure, retry } = usePreviewImage(
    sourceId,
    Boolean(sourceId),
    fileName
  );

  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden bg-muted',
        className
      )}
    >
      {url ? (
        /* eslint-disable-next-line @next/next/no-img-element -- data URL ya
            reducida en el cliente; `next/image` solo agregaría una vuelta por el
            optimizador. */
        <img src={url} alt={fileName} className="size-full object-contain" />
      ) : failed ? (
        <div className="flex max-w-md flex-col items-center gap-2 px-4 text-center">
          <ImageOff className="size-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            {failureCopy(failure, failedNote)}
          </p>
          {isWorthRetrying(failure) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={retry}
              className="h-7 gap-1.5 text-xs"
            >
              <RefreshCw className="size-3.5" />
              Reintentar
            </Button>
          )}
        </div>
      ) : (
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      )}

      {/* Solo cuando hay imagen: la lupa no sirve si lo que se abriría es el
          mensaje de error, y el botón flotando sobre el texto estorba. */}
      {url && <DocumentLightbox url={url} fileName={fileName} />}
    </div>
  );
}
