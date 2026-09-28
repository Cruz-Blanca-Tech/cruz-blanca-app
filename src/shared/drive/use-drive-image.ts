'use client';

import { useEffect, useRef, useState } from 'react';

import {
  loadDrivePreview,
  loadDriveThumbnail,
  peekDrivePreview,
  peekDriveThumbnail,
} from './thumbnail';

/**
 * Hooks para pintar imágenes de Drive privados.
 *
 * La descarga y el redimensionado viven en `thumbnail.ts`; esto es solo la
 * parte de React, y vive aparte para que la galería de huecos y el selector de
 * Drive compartan exactamente el mismo comportamiento: si el selector
 * descargara miniaturas por su cuenta, tendría un segundo caché y un segundo
 * tope de concurrencia, y abrir la galería después de recorrer 400 archivos en
 * el selector los descargaría otra vez.
 */

type ImageLoader = (sourceId: string) => Promise<string>;
type ImagePeeker = (sourceId: string) => string | undefined;

/**
 * Imagen del archivo en el tamaño que pida el `loader`, una vez que `enabled`.
 *
 * El estado llega comparando contra el `sourceId`: si el archivo cambia, lo
 * que quedó cargado es de otro y no se muestra. El caché se lee durante el
 * render para no tener que setear estado sincrónico dentro del efecto.
 */
export function useDriveImage(
  sourceId: string,
  enabled: boolean,
  load: ImageLoader,
  peek: ImagePeeker
) {
  const [loaded, setLoaded] = useState<{ id: string; url: string } | null>(
    null
  );
  const [failedId, setFailedId] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !sourceId) return;
    let cancelled = false;
    void load(sourceId)
      .then((dataUrl) => {
        if (!cancelled) setLoaded({ id: sourceId, url: dataUrl });
      })
      .catch(() => {
        if (!cancelled) setFailedId(sourceId);
      });
    return () => {
      cancelled = true;
    };
  }, [sourceId, enabled, load]);

  const cached = enabled ? peek(sourceId) : undefined;
  return {
    url: loaded?.id === sourceId ? loaded.url : cached,
    failed: failedId === sourceId,
  };
}

/** Miniatura de 360px: la que entra en una tarjeta de contacto. */
export function useThumbnail(sourceId: string, enabled: boolean) {
  return useDriveImage(
    sourceId,
    enabled,
    loadDriveThumbnail,
    peekDriveThumbnail
  );
}

/** Vista previa de 2.000px: la que entra en un panel de revisión. */
export function usePreviewImage(sourceId: string, enabled: boolean) {
  return useDriveImage(sourceId, enabled, loadDrivePreview, peekDrivePreview);
}

/**
 * `true` cuando el elemento está a punto de entrar en pantalla.
 *
 * Es lo que evita pedir de golpe todas las miniaturas de una lista: la galería
 * descarga las ~20 que se ven y el resto a medida que se scrollea. El margen
 * de 400px hace que aparezcan ya cargadas al empezar a scrollear, en vez de
 * pedirla después de que la fila ya esté a la vista.
 *
 * `enabled` existe para las filas que no van a pedir imagen nunca —una carpeta,
 * un PDF—. El selector de Drive lista hasta 1.000 archivos por carpeta, y un
 * observador por cada carpeta sería un observador vivo que nunca va a
 * disparar, uno por fila, sin aportar nada.
 */
export function useNearViewport<T extends HTMLElement>(
  { margin = '400px', enabled = true }: { margin?: string; enabled?: boolean } = {}
) {
  const ref = useRef<T | null>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!enabled || !node || near) return;
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
  }, [near, margin, enabled]);

  return { ref, near };
}
