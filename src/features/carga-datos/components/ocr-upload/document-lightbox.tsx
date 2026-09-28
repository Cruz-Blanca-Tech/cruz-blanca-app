'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
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

/** Hasta dónde se aleja y se acerca la imagen, en múltiplos del tamaño justo. */
const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
/** Cuánto cambia el zoom por pasada de rueda. */
const WHEEL_STEP = 1.2;

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
 * La imagen abre a tamaño justo y se acerca girando la rueda del mouse sobre
 * ella; el porcentaje arriba a la derecha devuelve al tamaño justo con un clic.
 * Acercada, se recorre con las barras de desplazamiento del panel.
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

  /** Múltiplo del tamaño justo: 1 = el documento completo a la vista. */
  const [zoom, setZoom] = useState(1);
  /** Tamaño dibujado en pantalla a zoom 1, o `null` hasta medir imagen y panel. */
  const [fit, setFit] = useState<{ w: number; h: number } | null>(null);
  /** Tamaño real del `img` cargado, medido con `naturalWidth/Height`. */
  const naturalRef = useRef<{ w: number; h: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Al abrir la lupa (o cambiar de documento) no se puede heredar el
  // acercamiento ni la medición del documento anterior: se descartan apenas se
  // detecta el cambio, ajustando el estado durante el render y no en un efecto.
  const [lastKey, setLastKey] = useState('');
  const contentKey = `${open ? 'open' : 'closed'}|${url ?? ''}`;
  if (contentKey !== lastKey) {
    setLastKey(contentKey);
    setZoom(1);
    setFit(null);
  }

  // Al cambiar de imagen, la medición guardada deja de valer (le pertenece a
  // otro documento) y el panel vuelve arriba. El zoom ya se reinició en el
  // render de arriba; acá solo se tocan el ref y el DOM, que en un efecto sí.
  useEffect(() => {
    naturalRef.current = null;
    const el = containerRef.current;
    if (el) {
      el.scrollLeft = 0;
      el.scrollTop = 0;
    }
  }, [url]);

  /**
   * Calcula el tamaño justo: cuánto hay que dibujar la imagen para que entre
   * completa en el panel, manteniendo su proporción. Se vuelve a calcular si
   * cambia el tamaño del panel (ventana o columna).
   */
  const measureFit = useCallback(() => {
    const el = containerRef.current;
    const natural = naturalRef.current;
    if (!el || !natural || natural.w === 0 || natural.h === 0) {
      setFit(null);
      return;
    }
    const base = Math.min(el.clientWidth / natural.w, el.clientHeight / natural.h);
    setFit({ w: natural.w * base, h: natural.h * base });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    measureFit();
    const observer = new ResizeObserver(measureFit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measureFit]);

  /**
   * Rueda del mouse: acerca y aleja. Se escucha en modo no pasivo porque
   * React registra la rueda como pasiva y no se podría cancelar el
   * desplazamiento; acá la rueda hace zoom y no mueve la imagen.
   *
   * El punto bajo el cursor se mantiene bajo el cursor al cambiar el zoom:
   * si el documento está acercado en una zona, la rueda acerca justo ahí y no
   * "salta" al centro.
   */
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !fit) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? WHEEL_STEP : 1 / WHEEL_STEP;
      const next = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, +(zoom * factor).toFixed(2))
      );
      if (next === zoom) return;

      const rect = el.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const sizeW = fit.w * zoom;
      const sizeH = fit.h * zoom;
      // El punto bajo el cursor, en proporción del contenido. Cuando el
      // contenido entra completo, `m-auto` lo centra y su borde no está en
      // `scrollLeft`: se descuenta el margen que el navegador reparte.
      const offsetX = Math.max(0, (el.clientWidth - sizeW) / 2);
      const offsetY = Math.max(0, (el.clientHeight - sizeH) / 2);
      const ratioX = (el.scrollLeft + px - offsetX) / sizeW;
      const ratioY = (el.scrollTop + py - offsetY) / sizeH;

      flushSync(() => setZoom(next));
      // Con el nuevo tamaño ya aplicado (flushSync), el desplazamiento entra
      // en el rango válido del navegador y conserva el punto del cursor.
      const nw = fit.w * next;
      const nh = fit.h * next;
      el.scrollLeft = ratioX * nw - px;
      el.scrollTop = ratioY * nh - py;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoom, fit]);

  const handleImageLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const img = event.currentTarget;
      if (img.naturalWidth && img.naturalHeight) {
        naturalRef.current = { w: img.naturalWidth, h: img.naturalHeight };
        measureFit();
      }
    },
    [measureFit]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        className="relative flex h-[90vh] w-[96vw] max-w-[96vw] flex-col gap-2 overflow-hidden bg-slate-950/95 p-3 sm:max-w-[96vw]"
      >
        <div className="flex shrink-0 items-center justify-between gap-3">
          <DialogTitle className="truncate text-sm font-medium text-slate-200">
            {fileName}
          </DialogTitle>
          <div className="flex shrink-0 items-center gap-2">
            {url && fit && (
              <button
                type="button"
                onClick={() => setZoom(1)}
                title="Girar la rueda para hacer zoom. Clic para volver al tamaño justo."
                aria-label="Volver al tamaño justo"
                className="rounded bg-white/10 px-2 py-0.5 font-data text-[11px] text-slate-200 transition-colors hover:bg-white/20"
              >
                {Math.round(zoom * 100)}%
              </button>
            )}
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
        </div>

        {/* `overflow-auto` es lo que permite recorrer el documento acercado;
            `m-auto` al contenido lo centra cuando entra completo y deja las
            esquinas alcanzables cuando no. */}
        <div ref={containerRef} className="flex min-h-0 flex-1 overflow-auto">
          {url ? (
            fit ? (
              <div
                className="m-auto shrink-0"
                style={{ width: fit.w * zoom, height: fit.h * zoom }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- data URL ya
                    reducida en el cliente; `next/image` solo agregaría una vuelta por
                    el optimizador. */}
                <img
                  src={url}
                  alt={fileName}
                  draggable={false}
                  onLoad={handleImageLoad}
                  className="block h-full w-full select-none object-contain"
                />
              </div>
            ) : (
              // Mientras se mide el tamaño justo (primera pasada de la imagen),
              // se muestra centrada como hasta ahora.
              <div className="m-auto flex h-full w-full items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element -- data URL ya
                    reducida en el cliente; `next/image` solo agregaría una vuelta por
                    el optimizador. */}
                <img
                  src={url}
                  alt={fileName}
                  draggable={false}
                  onLoad={handleImageLoad}
                  className="max-h-full max-w-full select-none object-contain"
                />
              </div>
            )
          ) : failure ? (
            // El mismo texto por motivo que en la vista previa, y no un
            // "no se puede ver" genérico: si lo que falló fue la sesión o la
            // red, el archivo puede estar perfecto y el operador no debe
            // llegar a la conclusión de que hay que descartarlo.
            <div className="m-auto flex max-w-md flex-col items-center gap-2 px-4 text-center">
              <ImageOff className="size-6 text-slate-400" />
              <p className="text-sm text-slate-300">
                {failureCopy(failure, failedNote)}
              </p>
            </div>
          ) : (
            <div className="m-auto">
              <Loader2 className="size-6 animate-spin text-slate-400" />
            </div>
          )}
        </div>

        {url && fit && (
          <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded bg-black/50 px-2 py-0.5 text-[10.5px] text-slate-300">
            Girar la rueda para hacer zoom
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
