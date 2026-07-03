'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageOff, Images, Loader2, ZoomIn } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { ExpectedDocument } from '../../types';

interface ExpectedDocumentsProps {
  /** Documentos esperados de la actividad seleccionada. */
  documents: ExpectedDocument[];
  /** Nombre del programa, para el badge superior. */
  programLabel?: string;
  /** Nombre de la actividad, para la descripción. */
  activityLabel?: string;
  /** Hay una actividad seleccionada (aunque aún no lleguen sus documentos). */
  hasActivity: boolean;
  /** Cargando documentos/catálogo. */
  isLoading?: boolean;
}

export function ExpectedDocuments({
  documents,
  programLabel,
  activityLabel,
  hasActivity,
  isLoading = false,
}: ExpectedDocumentsProps) {
  const [zoomDoc, setZoomDoc] = useState<ExpectedDocument | null>(null);

  // Sin actividad seleccionada: estado vacío explicativo.
  if (!hasActivity) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-slate-50 px-4.5 py-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
          <Images className="size-4.5" />
        </div>
        <div>
          <p className="text-sm font-medium text-ink-secondary">
            Documentos esperados
          </p>
          <p className="mt-0.5 font-data text-xs text-muted-foreground">
            Selecciona programa y actividad para ver qué documentos debe
            contener este expediente.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-slate-50 px-4 py-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando documentos esperados…
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-slate-50 px-4.5 py-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
          <ImageOff className="size-4.5" />
        </div>
        <div>
          <p className="text-sm font-medium text-ink-secondary">
            Sin documentos definidos
          </p>
          <p className="mt-0.5 font-data text-xs text-muted-foreground">
            Esta actividad no tiene documentos requeridos configurados.
          </p>
        </div>
      </div>
    );
  }

  const isSingle = documents.length === 1;
  const cols = Math.min(documents.length, 5);

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink-secondary">
            Documentos esperados{' '}
            <span className="font-normal text-muted-foreground">
              · {documents.length}
            </span>
          </p>
          <p className="mt-0.5 font-data text-xs text-muted-foreground">
            Expediente típico para{' '}
            <strong className="font-medium text-ink-secondary">
              {activityLabel}
            </strong>
            . Cada miniatura muestra una referencia visual del formato.
          </p>
        </div>
        {programLabel && (
          <Badge variant="secondary" className="shrink-0">
            <span className="size-1.5 rounded-full bg-current" />
            {programLabel}
          </Badge>
        )}
      </div>

      <div
        className="grid gap-2.5"
        style={{
          gridTemplateColumns: isSingle
            ? '1fr'
            : `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {documents.map((doc) => (
          <button
            key={doc.id}
            type="button"
            onClick={() => setZoomDoc(doc)}
            className="group/doc flex flex-col overflow-hidden rounded-lg border border-border bg-card text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-[var(--shadow-dropdown)]"
          >
            <div
              className={cn(
                'relative overflow-hidden bg-slate-100',
                isSingle ? 'aspect-[5/2]' : 'aspect-[3/4]'
              )}
            >
              {doc.previewImageUrl ? (
                <Image
                  src={doc.previewImageUrl}
                  alt={doc.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 200px"
                  className="object-cover object-top"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-slate-400">
                  <ImageOff className="size-6" />
                </div>
              )}
              <span
                title={doc.code}
                className="absolute top-1.5 right-1.5 max-w-[calc(100%-0.75rem)] truncate rounded-sm border border-border bg-overlay-white82 px-1.5 py-0.5 font-data text-[10px] font-medium text-primary"
              >
                {doc.code}
              </span>
              <span className="absolute inset-0 flex items-center justify-center bg-overlay-brand10 opacity-0 transition-opacity group-hover/doc:opacity-100">
                <span className="rounded-full bg-card p-1.5 shadow-[var(--shadow-dropdown)]">
                  <ZoomIn className="size-3.5 text-primary" />
                </span>
              </span>
            </div>
            <div className="flex flex-col gap-1 p-2.5">
              <p className="text-sm font-medium leading-tight text-foreground">
                {doc.name}
              </p>
              <Badge variant="outline" className="border-info/40 text-info-dark">
                <span className="size-1.5 rounded-full bg-current" />
                mín {Math.round(doc.confidenceThreshold * 100)}%
              </Badge>
            </div>
          </button>
        ))}
      </div>

      <Dialog
        open={zoomDoc !== null}
        onOpenChange={(open) => !open && setZoomDoc(null)}
      >
        <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b border-border p-4">
            <DialogTitle>{zoomDoc?.name}</DialogTitle>
            <DialogDescription className="font-data text-primary">
              Sufijo: <strong>{zoomDoc?.code}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="flex max-h-[70vh] items-center justify-center bg-slate-900">
            {zoomDoc?.previewImageUrl ? (
              <div className="relative h-[70vh] w-full">
                <Image
                  src={zoomDoc.previewImageUrl}
                  alt={zoomDoc.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
                <ImageOff className="size-8" />
                <span className="font-data text-xs">
                  Sin imagen de ejemplo disponible
                </span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
