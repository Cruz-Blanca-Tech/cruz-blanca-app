'use client';

import { useState } from 'react';
import { ImageOff, Loader2, X, ZoomIn } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { ImageFailure } from '@/shared/drive/use-drive-image';

import { failureCopy } from './image-failure-copy';

interface DocumentLightboxProps {
  /**
   * Data URL ya reducida, o `undefined` mientras se pide.
   *
   * Opcional a propósito: en el panel de revisión la imagen ya está en caché y
   * llega siempre, pero en el selector de Drive la lupa tiene que poder abrirse
   * *antes* de tenerla —es lo que la pide— y mostrar que está trabajando.
   */
  url?: string;
  fileName: string;
  /** Por qué no se pudo mostrar, si no se pudo. Sin esto, solo el spinner. */
  failure?: ImageFailure;
  /** Qué decir cuando el archivo es el que no se puede dibujar. */
  failedNote?: string;
  /**
   * Se llama cuando se abre la lupa.
   *
   * Es el gancho del selector de Drive: la versión grande se pide al apretar,
   * no antes, así que el pedido arranca con la apertura y no con el render.
   */
  onOpen?: () => void;
  /**
   * Estado controlado desde afuera.
   *
   * La pantalla donde vive la lupa ya tiene su propio botón para mirar —el
   * ojito de la bandeja, no un iconito de lupa— y quiere abrirla y cerrarla
   * ella. Con `open` + `onOpenChange` lo hace. Sin `open`, la lupa se gobierna
   * sola con su `DialogTrigger` (el caso del panel de revisión, la galería y
   * el selector de Drive).
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * No renderiza el botón de lupa por defecto. Sin él, el diálogo solo se
   * abre si `open` viene controlado desde afuera.
   */
  showTrigger?: boolean;
}

/**
 * El botón de lupa y la pantalla de adentro.
 *
 * El panel de revisión muestra el documento en una caja de ~600px, y a esa
 * escala un DNI de 1.400px de ancho es ilegible: se reconoce que "parece un
 * documento", pero no se lee el nombre ni se ve si la foto es de la persona
 * correcta. Esta pantalla es para eso —mirar de verdad— y no para cambiar nada,
 * así que no tiene acciones: se abre, se mira y se cierra.
 *
 * En el panel de revisión y en la galería de huecos recibe la `url` ya
 * resuelta, así que no hay ni loader ni estado de error: la comparten por el
 * caché de vistas previas y pasar de una a otra no baja los 2.000px otra vez.
 *
 * `sm:max-w-[96vw]` y no `max-w-...`: el Popup base trae `sm:max-w-sm` y una
 * variante le gana a la clase sin prefijo.
 */
export function DocumentLightbox({
  url,
  fileName,
  failure,
  failedNote = 'No se puede mostrar esta vista previa.',
  onOpen,
  open: openProp,
  onOpenChange,
  showTrigger = true,
}: DocumentLightboxProps) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOpenState(next);
    onOpenChange?.(next);
    // Solo al abrir: al cerrar no hay nada que pedir.
    if (next) onOpen?.();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      {showTrigger && (
        <DialogTrigger
          render={
            <Button
              variant="secondary"
              size="icon-sm"
              className="absolute top-2 right-2 z-10 shadow-md"
            />
          }
        >
          <ZoomIn className="size-4" />
          <span className="sr-only">Ver {fileName} más grande</span>
        </DialogTrigger>
      )}

      <DialogContent
        showCloseButton={false}
        className="flex h-[90vh] w-[96vw] max-w-[96vw] flex-col gap-2 overflow-hidden bg-slate-950/95 p-3 sm:max-w-[96vw]"
      >
        <div className="flex shrink-0 items-center justify-between gap-3">
          <DialogTitle className="truncate text-sm font-medium text-slate-200">
            {fileName}
          </DialogTitle>
          {/* Propio y no el de la base: ese es un botón ghost claro, que sobre
              un panel negro no se ve. */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpen(false)}
            className="text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
            <span className="sr-only">Cerrar</span>
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center">
          {url ? (
            /* eslint-disable-next-line @next/next/no-img-element -- data URL ya
                reducida en el cliente; `next/image` solo agregaría una vuelta por
                el optimizador. */
            <img
              src={url}
              alt={fileName}
              className="max-h-full max-w-full object-contain"
            />
          ) : failure ? (
            // El mismo texto por motivo que en la vista previa, y no un
            // "no se puede ver" genérico: si lo que falló fue la sesión o la
            // red, el archivo puede estar perfecto y el operador no debe
            // llegar a la conclusión de que hay que descartarlo.
            <div className="flex max-w-md flex-col items-center gap-2 px-4 text-center">
              <ImageOff className="size-6 text-slate-400" />
              <p className="text-sm text-slate-300">
                {failureCopy(failure, failedNote)}
              </p>
            </div>
          ) : (
            <Loader2 className="size-6 animate-spin text-slate-400" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
