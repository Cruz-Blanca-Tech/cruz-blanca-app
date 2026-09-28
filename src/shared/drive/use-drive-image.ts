'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  failureOf,
  loadDrivePreview,
  loadDriveThumbnail,
  peekDrivePreview,
  peekDriveThumbnail,
  type ImageFailure,
} from './thumbnail';

export type { ImageFailure };

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

type ImageLoader = (sourceId: string, fileName?: string) => Promise<string>;
type ImagePeeker = (sourceId: string) => string | undefined;

interface DriveImageState {
  url: string | undefined;
  failed: boolean;
  /** Por qué no se pudo mostrar. `undefined` mientras carga o si salió bien. */
  failure: ImageFailure | undefined;
  /** Vuelve a pedirla. Para lo que falló por el momento, no por el archivo. */
  retry: () => void;
}

/**
 * Imagen del archivo en el tamaño que pida el `loader`, una vez que `enabled`.
 *
 * El estado llega comparando contra el `sourceId`: si el archivo cambia, lo
 * que quedó cargado es de otro y no se muestra. El caché se lee durante el
 * render para no tener que setear estado sincrónico dentro del efecto.
 *
 * `fileName` no es para el caché —que se indexa por `sourceId`— sino para
 * descartar antes de descargar lo que el navegador no puede decodificar. Ver
 * `UNRENDERABLE_EXTENSIONS`.
 */
export function useDriveImage(
  sourceId: string,
  enabled: boolean,
  load: ImageLoader,
  peek: ImagePeeker,
  fileName = ''
): DriveImageState {
  const [loaded, setLoaded] = useState<{ id: string; url: string } | null>(
    null
  );
  /**
   * El error lleva el número del intento del que salió.
   *
   * Es lo que hace desaparecer el mensaje viejo al apretar "Reintentar" sin
   * setear estado sincrónico dentro del efecto —que React marca como error, y
   * con razón. Un error de un intento viejo deja de ser el de ahora en cuanto
   * el número cambia, así que no hace falta limpiarlo.
   */
  const [error, setError] = useState<{
    id: string;
    attempt: number;
    failure: ImageFailure;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled || !sourceId) return;
    let cancelled = false;
    void load(sourceId, fileName)
      .then((dataUrl) => {
        if (!cancelled) setLoaded({ id: sourceId, url: dataUrl });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError({ id: sourceId, attempt, failure: failureOf(err) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [sourceId, fileName, enabled, load, attempt]);

  const cached = enabled ? peek(sourceId) : undefined;
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const isCurrentError = error?.id === sourceId && error.attempt === attempt;
  return {
    url: loaded?.id === sourceId ? loaded.url : cached,
    failed: Boolean(isCurrentError),
    failure: isCurrentError ? error.failure : undefined,
    retry,
  };
}

/** Miniatura de 360px: la que entra en una tarjeta de contacto. */
export function useThumbnail(
  sourceId: string,
  enabled: boolean,
  fileName = ''
): DriveImageState {
  return useDriveImage(
    sourceId,
    enabled,
    loadDriveThumbnail,
    peekDriveThumbnail,
    fileName
  );
}

/** Vista previa de 2.000px: la que entra en un panel de revisión. */
export function usePreviewImage(
  sourceId: string,
  enabled: boolean,
  fileName = ''
): DriveImageState {
  return useDriveImage(
    sourceId,
    enabled,
    loadDrivePreview,
    peekDrivePreview,
    fileName
  );
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
