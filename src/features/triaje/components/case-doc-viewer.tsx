'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  FileWarning,
  ImageIcon,
  Info,
  Minus,
  OctagonAlert,
  Plus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toDriveThumbnailUrl } from '@/lib/drive-image';
import type { DocumentDossierItem } from '../schemas/case-documents-schema';

interface CaseDocViewerProps {
  documents: DocumentDossierItem[];
  isLoading: boolean;
  isError: boolean;
  activeDocId: string | null;
  onSelectDoc: (id: string) => void;
  /** Muestra el aviso de "cambio automático" al saltar a un campo con documento. */
  autoSwitchHint: boolean;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;
/** Aspecto por defecto (A4 vertical) hasta que la imagen reporta su tamaño real. */
const DEFAULT_RATIO = 1 / 1.4142;

/** Visor de documentos del expediente: tabs por documento + zoom + lienzo. */
export function CaseDocViewer({
  documents,
  isLoading,
  isError,
  activeDocId,
  onSelectDoc,
  autoSwitchHint,
}: CaseDocViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [ratio, setRatio] = useState(DEFAULT_RATIO);

  const activeDoc =
    documents.find((d) => d.id === activeDocId) ?? documents[0] ?? null;
  const rawSrc = activeDoc ? toDriveThumbnailUrl(activeDoc.source_id) : null;
  // `<Image>` hace `new URL(src)` para orígenes remotos: si `source_id` no es una
  // URL de Drive reconocible (p. ej. un id suelto o una cadena mal formada),
  // `toDriveThumbnailUrl` lo devuelve intacto y rompería el visor. Además, el
  // `next.config` solo declara `localPatterns` (no `remotePatterns`), así que solo
  // una ruta local (`/api/drive-image`) es servible; cualquier otra cosa → sin
  // imagen disponible (en vez de romper el render).
  const imageSrc = rawSrc && rawSrc.startsWith('/') ? rawSrc : null;

  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-2.5">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-7 w-full" />
        <Skeleton className="flex-1 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <OctagonAlert className="size-7 text-error" />
        <p className="font-sans text-sm font-medium text-ink-secondary">
          No se pudieron cargar los documentos
        </p>
        <p className="font-data text-xs text-ink-muted">
          Vuelve a intentarlo en unos segundos.
        </p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <FileWarning className="size-7 text-ink-muted" />
        <p className="font-sans text-sm font-medium text-ink-secondary">
          Sin documentos escaneados
        </p>
        <p className="font-data text-xs text-ink-muted">
          Este expediente no tiene documentos asociados.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2.5">
      {/* Tabs de documentos */}
      <Tabs
        value={activeDoc?.id ?? undefined}
        onValueChange={(value) => onSelectDoc(String(value))}
        className="min-w-0 shrink-0"
      >
        <TabsList
          variant="line"
          className="h-auto w-full justify-start overflow-x-auto border-b border-border p-0"
        >
          {documents.map((doc) => (
            <TabsTrigger
              key={doc.id}
              value={doc.id}
              className="rounded-none px-3 py-2 font-sans text-[12.5px]"
            >
              {doc.file_name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Aviso de cambio automático */}
      {autoSwitchHint && activeDoc && (
        <div className="flex shrink-0 items-center gap-2 rounded-md border border-primary/20 bg-brand-100 px-2.5 py-1.5 font-data text-[11.5px] text-brand-dark">
          <Info className="size-3.5 shrink-0 text-primary" />
          <span>
            Mostrando <strong>{activeDoc.file_name}</strong> para verificar el
            campo seleccionado
          </span>
        </div>
      )}

      {/* Barra de zoom */}
      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 font-heading text-[12.5px] font-semibold text-ink-primary">
          <ImageIcon className="size-3.5 shrink-0 text-primary" />
          <span className="truncate">{activeDoc?.file_name}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() =>
              setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)))
            }
            aria-label="Alejar"
          >
            <Minus />
          </Button>
          <span className="w-10 text-center font-data text-[11px] text-ink-muted">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() =>
              setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)))
            }
            aria-label="Acercar"
          >
            <Plus />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7"
            onClick={() => setZoom(1)}
          >
            Ajustar
          </Button>
        </div>
      </div>

      {/* Lienzo */}
      <div className="flex flex-1 items-start justify-center overflow-auto rounded-lg bg-slate-800 p-3.5">
        {imageSrc ? (
          <div
            className="relative shrink-0 overflow-hidden rounded-sm bg-white shadow-modal transition-[width]"
            style={{
              width: `${100 * zoom}%`,
              aspectRatio: String(ratio),
            }}
          >
            <Image
              key={activeDoc?.id}
              src={imageSrc}
              alt={activeDoc?.file_name ?? 'Documento'}
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-contain"
              onLoad={(event) => {
                const img = event.currentTarget;
                if (img.naturalWidth && img.naturalHeight) {
                  setRatio(img.naturalWidth / img.naturalHeight);
                }
              }}
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center font-data text-xs text-slate-300">
            El documento no tiene una imagen disponible.
          </div>
        )}
      </div>
    </div>
  );
}
