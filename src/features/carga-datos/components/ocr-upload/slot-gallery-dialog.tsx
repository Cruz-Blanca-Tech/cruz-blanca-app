'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, ImageOff, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  loadDriveThumbnail,
  peekDriveThumbnail,
} from '@/shared/drive/thumbnail';

import type { ValidatedFileItem } from '../../hooks/use-batch-file-validation';

/** Un hueco libre de un expediente: el destino de lo que se elige acá. */
export interface GallerySlot {
  key: string;
  code: string;
}

export interface SlotGalleryDialogProps {
  /** Hueco a completar. `null` mantiene la galería cerrada. */
  slot: GallerySlot | null;
  /** Archivos que todavía no tienen expediente: los candidatos. */
  candidates: ValidatedFileItem[];
  /** Código -> nombre del documento, para el título. */
  codeNames: Record<string, string>;
  onPick: (sourceId: string) => void;
  onRemove: (sourceId: string) => void;
  /** Cierra la galería y abre el selector de Drive. */
  onAddFromDrive: () => void;
  onClose: () => void;
}

/**
 * Galería de los archivos sin expediente, para llenar un hueco.
 *
 * Reemplaza a la lista de nombres que aparecía en la bandeja cuando se elegía
 * un hueco. Con el lote real —141 archivos, 134 de ellos llamados
 * `Imagen (N).jpg`— esa lista no decía nada: el operador no puede saber que
 * `Imagen (5).jpg` es el DNI Apoderado de `90093246` sin abrirla. En una grilla
 * de fotos la pregunta se responde mirando, que es como se trabaja con un
 * montoncito de papeles sobre la mesa.
 *
 * Las miniaturas se piden **solo de las tarjetas que están por verse** y se
 * reducen en el cliente (ver `shared/drive/thumbnail`): abrir la galería con
 * 141 archivos no descarga 141 escaneos de 3MB.
 *
 * Al elegir, la galería no se cierra: pasa al siguiente hueco que queda libre.
 * El operador suele tener un montoncito de fotos para varios huecos de la
 * misma actividad, y hacerlo de a uno lo obligaría a cerrar y volver a hacer
 * clic por cada uno.
 */
export function SlotGalleryDialog({
  slot,
  candidates,
  codeNames,
  onPick,
  onRemove,
  onAddFromDrive,
  onClose,
}: SlotGalleryDialogProps) {
  return (
    <Dialog open={slot !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border p-4">
          <DialogTitle className="text-base">
            {slot && (
              <>
                Falta{' '}
                <span className="font-data font-semibold text-foreground">
                  {codeNames[slot.code] ?? slot.code}
                </span>{' '}
                en el expediente{' '}
                <span className="font-data font-semibold text-foreground">
                  {slot.key}
                </span>
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {candidates.length === 0
              ? 'No queda ningún archivo sin expediente. Traé más desde Drive.'
              : candidates.length === 1
                ? 'Hay 1 archivo sin expediente. Clic en la foto para ponerlo en este hueco.'
                : `Elegí la foto de los ${candidates.length} archivos sin expediente. Clic para ponerla en este hueco.`}
          </DialogDescription>
        </DialogHeader>

        {candidates.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <FileText className="size-8 text-muted-foreground" />
            <p className="max-w-sm text-sm text-muted-foreground">
              Los archivos que trajiste ya están todos con expediente. Si falta
              esta foto, traela de Drive.
            </p>
            <Button onClick={onAddFromDrive}>Agregar desde Drive</Button>
          </div>
        ) : (
          <ul className="grid max-h-[58vh] grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2 overflow-y-auto p-3">
            {candidates.map((item) => (
              <GalleryCard
                key={item.file.source_id}
                item={item}
                onPick={() => onPick(item.file.source_id)}
                onRemove={() => onRemove(item.file.source_id)}
              />
            ))}
          </ul>
        )}

        <footer className="flex items-center gap-2 border-t border-border p-3">
          {candidates.length > 0 && (
            <Button variant="outline" size="sm" onClick={onAddFromDrive}>
              <FileText className="size-4" />
              Agregar desde Drive
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-xs text-muted-foreground"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Tarjeta                                                             */
/* ------------------------------------------------------------------ */

interface GalleryCardProps {
  item: ValidatedFileItem;
  onPick: () => void;
  onRemove: () => void;
}

function GalleryCard({ item, onPick, onRemove }: GalleryCardProps) {
  const sourceId = item.file.source_id;
  const { ref, near } = useNearViewport<HTMLLIElement>();
  const { url, failed } = useThumbnail(sourceId, near);

  return (
    <li ref={ref} className="group relative">
      <button
        type="button"
        onClick={onPick}
        title={`Poner ${item.file.file_name} en este hueco`}
        className="flex w-full flex-col overflow-hidden rounded-md border border-border bg-card text-left transition-colors hover:border-primary focus-visible:border-primary focus-visible:outline-none"
      >
        <span className="flex aspect-3/4 w-full items-center justify-center overflow-hidden bg-muted">
          {url ? (
            /* eslint-disable-next-line @next/next/no-img-element -- data URL
                de 18KB ya reducida en el cliente; `next/image` solo agregaría
                una vuelta por el optimizador. */
            <img
              src={url}
              alt={item.file.file_name}
              className="size-full object-cover"
            />
          ) : failed ? (
            <ImageOff className="size-5 text-muted-foreground" />
          ) : (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          )}
        </span>
        <span className="truncate px-1.5 py-1 font-data text-[11px] text-muted-foreground">
          {item.file.file_name}
        </span>
      </button>

      {/* Siempre visible, no solo al pasar el mouse: en una pantalla táctil
          no hay hover y el operador se queda sin forma de descartar un
          escaneo equivocado. */}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Sacar ${item.file.file_name} del lote`}
        className="absolute top-1 right-1 rounded-full bg-popover/85 p-1 text-muted-foreground shadow-sm transition-colors hover:bg-error-light hover:text-error"
      >
        <X className="size-3" />
      </button>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Miniatura                                                           */
/* ------------------------------------------------------------------ */

/**
 * Miniatura del archivo, solo si la tarjeta está cerca de la vista.
 *
 * El estado llega comparando contra el `sourceId`: si el archivo cambia, lo
 * que quedó cargado es de otro y no se muestra. El caché se lee durante el
 * render para no tener que setear estado sincrónico dentro del efecto.
 */
function useThumbnail(sourceId: string, enabled: boolean) {
  const [loaded, setLoaded] = useState<{ id: string; url: string } | null>(
    null
  );
  const [failedId, setFailedId] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void loadDriveThumbnail(sourceId)
      .then((dataUrl) => {
        if (!cancelled) setLoaded({ id: sourceId, url: dataUrl });
      })
      .catch(() => {
        if (!cancelled) setFailedId(sourceId);
      });
    return () => {
      cancelled = true;
    };
  }, [sourceId, enabled]);

  const cached = enabled ? peekDriveThumbnail(sourceId) : undefined;
  return {
    url: loaded?.id === sourceId ? loaded.url : cached,
    failed: failedId === sourceId,
  };
}

/**
 * `true` cuando el elemento está a punto de entrar en pantalla.
 *
 * Es lo que evita pedir las 141 miniaturas de golpe: con la galería abierta se
 * descargan las ~20 que se ven y las demás a medida que se scrollea.
 */
function useNearViewport<T extends HTMLElement>(margin = '400px') {
  const ref = useRef<T | null>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || near) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: margin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [near, margin]);

  return { ref, near };
}
