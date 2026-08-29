'use client';

import Image from 'next/image';
import { ImageOff } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface ZoomTarget {
  name: string;
  code: string;
  previewImageUrl: string | null;
}

/** Modal de zoom de la imagen de ejemplo de un documento del catálogo. */
export function DocumentZoomDialog({
  zoom,
  onClose,
}: {
  zoom: ZoomTarget | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={zoom !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border p-4">
          <DialogTitle>{zoom?.name}</DialogTitle>
          <DialogDescription className="font-data text-primary">
            Sufijo: <strong>{zoom?.code}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="flex max-h-[70vh] items-center justify-center bg-slate-900">
          {zoom?.previewImageUrl ? (
            <div className="relative h-[70vh] w-full">
              <Image
                src={zoom.previewImageUrl}
                alt={zoom.name}
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
  );
}
