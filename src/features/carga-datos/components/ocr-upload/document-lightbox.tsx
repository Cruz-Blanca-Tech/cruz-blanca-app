'use client';

import { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface DocumentLightboxProps {
  /** Data URL ya reducida. La lupa no vuelve a descargar nada. */
  url: string;
  fileName: string;
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
 * Recibe la `url` ya resuelta en vez de volver a pedir la imagen: el panel de
 * revisión y la galería comparten el caché de vistas previas, así que pasar de
 * uno a otro no baja los 2.000px otra vez, y con `url` en mano no hay ni
 * loader ni estado de error que manejar acá.
 *
 * `sm:max-w-[96vw]` y no `max-w-...`: el Popup base trae `sm:max-w-sm` y una
 * variante le gana a la clase sin prefijo.
 */
export function DocumentLightbox({ url, fileName }: DocumentLightboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL ya
              reducida en el cliente; `next/image` solo agregaría una vuelta por
              el optimizador. */}
          <img
            src={url}
            alt={fileName}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
