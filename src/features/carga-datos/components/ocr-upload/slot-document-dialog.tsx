'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, FileText, Search, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn, searchText } from '@/lib/utils';

import type { ValidatedFileItem } from '../../hooks/use-batch-file-validation';
import { DocumentPreview } from './document-preview';

/** Un hueco libre de otro expediente: a dónde se puede llevar este archivo. */
export interface MoveDestination {
  key: string;
  code: string;
}

export interface SlotDocumentDialogProps {
  /** Documento ya asociado que se está revisando. `null` cierra el diálogo. */
  item: ValidatedFileItem | null;
  /** Clave y código de la ranura que ocupa hoy. */
  slotKey: string;
  slotCode: string;
  codeNames: Record<string, string>;
  /** Huecos libres del lote, en el mismo orden que los muestra el tablero. */
  destinations: MoveDestination[];
  /**
   * Traer otra foto para esta ranura. El tablero la abre con la galería de
   * huecos, que ya sabe cómo reemplazar al ocupante.
   */
  onReplace: () => void;
  onMove: (key: string, code: string) => void;
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
 * Acá solo hay una pregunta, y son dos las respuestas posibles porque son dos
 * fallos distintos: o la foto no es el documento que dice ser (se trae otro), o
 * es el documento pero de otra persona (se lleva a otro expediente). Un solo
 * botón no alcanza para las dos, y adivinar mal cuál era el problema es lo que
 * cuesta.
 *
 * Los destinos no están siempre a la vista: aparecen solo si el operador dice
 * que el problema es la persona. Con 25 expedientes la lista son decenas de
 * huecos, y mostrarlos de entrada taparía la foto, que es lo que hay que
 * revisar.
 */
export function SlotDocumentDialog({
  item,
  slotKey,
  slotCode,
  codeNames,
  destinations,
  onReplace,
  onMove,
  onRemove,
  onClose,
}: SlotDocumentDialogProps) {
  /** `null` = se está revisando la foto. Un texto = se está eligiendo destino. */
  const [moving, setMoving] = useState(false);
  const [moveQuery, setMoveQuery] = useState('');

  // La búsqueda se reinicia al cerrar: si el operador se va a revisar otra foto
  // del mismo lote, no quiere heredar el texto de la anterior.
  const reset = () => {
    setMoving(false);
    setMoveQuery('');
    onClose();
  };

  const query = searchText(moveQuery);
  const filtered = useMemo(() => {
    if (!query) return destinations;
    return destinations.filter((d) =>
      searchText(`${d.key} ${codeNames[d.code] ?? d.code}`).includes(query)
    );
  }, [destinations, query, codeNames]);

  return (
    <Dialog open={item !== null} onOpenChange={(next) => !next && reset()}>
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

          {moving ? (
            <div className="mt-2.5 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMoving(false)}
                  className="h-7 shrink-0 gap-1 px-1.5 text-xs"
                >
                  <ArrowLeft className="size-3.5" />
                  Volver
                </Button>
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={moveQuery}
                    onChange={(e) => setMoveQuery(e.target.value)}
                    placeholder="Buscar expediente o tipo de documento…"
                    aria-label="Buscar un hueco libre"
                    className="h-8 pl-8 text-xs"
                  />
                </div>
              </div>

              {filtered.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No hay ningún hueco libre que coincida.
                </p>
              ) : (
                <ul className="max-h-44 flex flex-col gap-1 overflow-y-auto">
                  {filtered.map((dest) => (
                    <li key={`${dest.key}|${dest.code}`}>
                      <button
                        type="button"
                        onClick={() => onMove(dest.key, dest.code)}
                        className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-left transition-colors hover:border-primary hover:bg-primary/5"
                      >
                        <span className="font-data text-xs font-semibold text-foreground">
                          {dest.key}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                          {codeNames[dest.code] ?? dest.code}
                        </span>
                        <span className="shrink-0 text-[11px] text-primary">
                          poner acá
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {destinations.length > 0
                  ? '¿Está bien este documento?'
                  : 'No hay ningún hueco libre en el lote. Si el documento está bien, dejalo donde está.'}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={onReplace} className="flex-1">
                  Cambiar por otro documento
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMoving(true)}
                  disabled={destinations.length === 0}
                  className="flex-1"
                >
                  Asociar a otro expediente
                </Button>
              </div>
            </>
          )}

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
              onClick={reset}
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
