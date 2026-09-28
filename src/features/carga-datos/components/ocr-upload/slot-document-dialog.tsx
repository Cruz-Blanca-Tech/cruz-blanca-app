'use client';

import { FileText, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import type { ValidatedFileItem } from '../../hooks/use-batch-file-validation';
import { DocumentPreview } from './document-preview';

export interface SlotDocumentDialogProps {
  /** Documento ya asociado que se está revisando. `null` cierra el diálogo. */
  item: ValidatedFileItem | null;
  /** Clave y código de la ranura que ocupa hoy. */
  slotKey: string;
  slotCode: string;
  codeNames: Record<string, string>;
  /**
   * Traer otra foto para esta ranura. El tablero la abre con la galería de
   * huecos, que ya sabe cómo reemplazar al ocupante.
   */
  onReplace: () => void;
  onRemove: () => void;
  onClose: () => void;
}

/**
 * Mirar un documento que ya está asociado y decidir si está bien.
 *
 * Reemplaza al visor que se abría antes con un clic en un `✓ DJ` del tablero.
 * Ese visor era un formulario: clave, tipo de documento, lista de destinos y
 * un botón de guardar. Pero para un documento que ya está colocado, el destino
 * ya está decidido —se ve en el tablero— y lo único que el operador está
 * haciendo es **revisar**. Abrirle un formulario con campos precargados que
 * tenía que volver a leer para confirmar lo que ya sabía es ruido.
 *
 * Acá solo hay una pregunta: si el documento no es lo que dice ser, se trae
 * otro para esta ranura. Llevar un documento a otro expediente se resuelve
 * arrastrándolo en el tablero, no desde acá.
 */
export function SlotDocumentDialog({
  item,
  slotKey,
  slotCode,
  codeNames,
  onReplace,
  onRemove,
  onClose,
}: SlotDocumentDialogProps) {
  return (
    <Dialog open={item !== null} onOpenChange={(next) => !next && onClose()}>
      {/* `sm:max-w-*` y no `max-w-*`: el Popup base trae `sm:max-w-sm`, y una
          variante le gana a la clase sin prefijo. */}
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-3xl">
        {/* Mismo encabezado que la galería de huecos, y por el mismo motivo: el
            destino se lee antes que nada, y el tipo de documento a la derecha
            queda justo encima de la foto. */}
        <DialogHeader className="border-b border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <DialogTitle className="text-base">
              <span className="flex items-baseline gap-2">
                <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  Expediente
                </span>
                <span className="font-data text-lg font-semibold text-foreground">
                  {slotKey}
                </span>
                <span className="sr-only">
                  , documento {codeNames[slotCode] ?? slotCode}
                </span>
              </span>
            </DialogTitle>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">
              <FileText className="size-4 shrink-0" />
              {codeNames[slotCode] ?? slotCode}
            </span>
          </div>
          <DialogDescription className="text-xs">
            Revisá que sea el documento correcto y el de esta persona.
          </DialogDescription>
        </DialogHeader>

        <DocumentPreview
          sourceId={item?.file.source_id ?? ''}
          fileName={item?.file.file_name ?? ''}
          className="max-h-[52vh] min-h-40"
          failedNote="No se puede mostrar esta foto. Si el archivo está bien, dejalo donde está o traé otro."
        />

        <div className="border-t border-border p-3">
          {item && (
            <p className="truncate font-data text-xs font-medium text-foreground">
              {item.file.file_name}
            </p>
          )}

          <p className="mt-1 text-[11px] text-muted-foreground">
            ¿Está bien este documento?
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={onReplace} className="flex-1">
              Cambiar por otro documento
            </Button>
          </div>

          <div className="mt-1.5 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-7 gap-1.5 text-xs text-error"
            >
              <Trash2 className="size-3.5" />
              Sacar del lote
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className={cn('ml-auto h-7 text-xs text-muted-foreground')}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}