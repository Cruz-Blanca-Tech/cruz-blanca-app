'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import { FileText, ImageOff, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  useNearViewport,
  useThumbnail,
} from '@/shared/drive/use-drive-image';

import type { ValidatedFileItem } from '../../hooks/use-batch-file-validation';
import { DocumentPreview } from './document-preview';

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
 * `Imagen (5).jpg` es el DNI Apoderado de `90093246` sin abrirla.
 *
 * Son dos paneles porque son dos preguntas distintas. La grilla de miniaturas
 * responde *"¿qué documento es esto?"*, que con 150px alcanza. La vista previa
 * responde *"¿es el de esta persona?"*, que es la que de verdad importa — hay
 * que poder leer el nombre del DNI — y necesita la foto grande.
 *
 * Por eso el clic **no** asocia: selecciona, y la foto grande aparece al lado.
 * Asociar es un botón aparte que dice a qué expediente va. Ese paso extra es
 * deliberado: un DNI cargado en el expediente equivocado no tiene forma
 * barata de deshacerse, y el nombre del destino en el botón es lo que evita
 * hacerlo. Para cuando la miniatura ya alcanza —el operador sabe cuál es
 * porque él la escaneó— el doble clic y el `Enter` asocian directo.
 *
 * Las imágenes se piden **solo de las tarjetas que están por verse** y se
 * reducen en el cliente (ver `shared/drive/thumbnail`): abrir la galería con
 * 141 archivos no descarga 141 escaneos de 3MB. La vista previa es una sola
 * imagen a la vez, así que el costo extra es el de mirar un documento.
 *
 * Al asociar, la galería no se cierra: pasa al siguiente hueco que queda libre.
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /**
   * La selección se *deriva* en vez de tener un efecto que la ponga en sync.
   *
   * Así no hace falta un `useEffect` para el caso de que el archivo elegido ya
   * no esté en la lista —justo lo que pasa al asociar, porque sale de los
   * candidatos—: `findIndex` da -1, cae en el primero, y la galería queda
   * lista para el siguiente hueco sin código de reseteo.
   */
  const selectedIndex = Math.max(
    0,
    candidates.findIndex((c) => c.file.source_id === selectedId)
  );
  const selected = candidates[selectedIndex] ?? null;

  const assign = () => {
    if (selected) onPick(selected.file.source_id);
  };

  return (
    <Dialog open={slot !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-6xl">
        {/* El destino se parte en dos: el expediente a la izquierda, que es la
            persona, y el tipo de documento a la derecha, que es lo que hay que
            completar. Estaban en una sola frase, "Falta DNI Apoderado en el
            expediente 900220720", y con el tipo primero la lectura empezaba por
            lo que el operador ya sabe —el archivo que le falta— en vez de por
            el dato que lo identifica.

            El tipo además va arriba a la derecha a propósito: en el layout de
            dos columnas cae justo sobre el panel de vista previa y el botón, o
            sea sobre la decisión, y no hay que ir a buscarlo. */}
        <DialogHeader className="border-b border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <DialogTitle className="text-base">
              {slot && (
                <span className="flex items-baseline gap-2">
                  <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    Expediente
                  </span>
                  <span className="font-data text-lg font-semibold text-foreground">
                    {slot.key}
                  </span>
                  {/* El `DialogTitle` es el nombre accesible del diálogo, y el
                      tipo de documento quedó fuera de él, en el badge de al
                      lado. Sin esto, un lector de pantalla anunciaría
                      "Expediente 900220720" y perdería justo el dato que dice
                      qué se está llenando. */}
                  <span className="sr-only">
                    , documento {codeNames[slot.code] ?? slot.code}
                  </span>
                </span>
              )}
            </DialogTitle>

            {slot && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">
                <FileText className="size-4 shrink-0" />
                {codeNames[slot.code] ?? slot.code}
              </span>
            )}
          </div>
          <DialogDescription className="text-xs">
            {candidates.length === 0
              ? 'No queda ningún archivo sin expediente. Traé más desde Drive.'
              : candidates.length === 1
                ? 'Hay 1 archivo sin expediente. Clic en la foto para verla grande y después asociarla.'
                : `${candidates.length} archivos sin expediente. Clic en una foto para verla grande y después asociarla.`}
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
          <div className="grid md:grid-cols-[minmax(0,1fr)_360px]">
            <GalleryGrid
              candidates={candidates}
              selectedIndex={selectedIndex}
              onSelect={setSelectedId}
              onAssignSelected={assign}
              onAssignFile={onPick}
              onRemove={onRemove}
            />

            {/* Arriba en móvil, al lado en escritorio: en los dos casos tiene
                que estar a la vista de la selección, que es donde se decide. */}
            <aside className="order-1 flex flex-col border-b border-border md:order-2 md:border-b-0 md:border-l">
              <PreviewPane
                item={selected}
                onAssign={assign}
                onRemove={selected ? () => onRemove(selected.file.source_id) : undefined}
              />
            </aside>
          </div>
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
/* Grilla                                                              */
/* ------------------------------------------------------------------ */

interface GalleryGridProps {
  candidates: ValidatedFileItem[];
  selectedIndex: number;
  onSelect: (sourceId: string) => void;
  /** `Enter`: asocia lo que esté seleccionado. */
  onAssignSelected: () => void;
  /** Doble clic en una tarjeta: asocia **esa** tarjeta, no la seleccionada. */
  onAssignFile: (sourceId: string) => void;
  onRemove: (sourceId: string) => void;
}

/** Cuánto avanza la selección con cada flecha. */
const STEP = {
  ArrowRight: 1,
  ArrowLeft: -1,
  ArrowDown: 1,
  ArrowUp: -1,
} as const;

function GalleryGrid({
  candidates,
  selectedIndex,
  onSelect,
  onAssignSelected,
  onAssignFile,
  onRemove,
}: GalleryGridProps) {
  const listRef = useRef<HTMLUListElement | null>(null);

  /**
   * Recorrido con flechas y `Enter` para asociar.
   *
   * Con 134 candidatos, pasar uno por uno con el mouse es la parte lenta del
   * trabajo. Arriba y abajo saltan una fila entera, y para eso hace falta
   * saber cuántas columnas hay.
   */
  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    // `KeyboardEvent.key` es "ArrowRight", no "right".
    const step = STEP[e.key as keyof typeof STEP];

    if (step !== undefined) {
      e.preventDefault();
      // Para saber cuántas columnas hay no hay que medirlas: el
      // `gridTemplateColumns` computado ya viene resuelto a píxeles, y
      // `auto-fill` lo recalcula solo cuando cambia el ancho.
      const perRow =
        getComputedStyle(listRef.current as HTMLUListElement)
          .gridTemplateColumns.split(' ')
          .filter(Boolean).length || 1;
      const delta = e.key === 'ArrowDown' || e.key === 'ArrowUp' ? perRow : 1;
      const next = Math.min(
        candidates.length - 1,
        Math.max(0, selectedIndex + delta * step)
      );
      onSelect(candidates[next].file.source_id);
      // La tarjeta nueva puede estar fuera del scroll: sin esto, seguir con
      // las flechas "mueve" la selección a un lugar que no se ve.
      listRef.current
        ?.querySelector('[data-selected="true"]')
        ?.scrollIntoView({ block: 'nearest' });
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      onAssignSelected();
    }
  };

  return (
    <ul
      ref={listRef}
      // `listbox` porque es exactamente eso: una lista de opciones de la que
      // se elige una, y la seleccionada tiene que quedar legible para el
      // lector de pantalla.
      role="listbox"
      aria-label="Archivos sin expediente"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="order-2 grid max-h-[34vh] grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))] gap-2 overflow-y-auto p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring md:order-1 md:max-h-[56vh]"
    >
      {candidates.map((item, index) => (
        <GalleryCard
          key={item.file.source_id}
          item={item}
          selected={index === selectedIndex}
          onSelect={() => onSelect(item.file.source_id)}
          onAssign={() => onAssignFile(item.file.source_id)}
          onRemove={() => onRemove(item.file.source_id)}
        />
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Tarjeta                                                             */
/* ------------------------------------------------------------------ */

interface GalleryCardProps {
  item: ValidatedFileItem;
  selected: boolean;
  onSelect: () => void;
  onAssign: () => void;
  onRemove: () => void;
}

function GalleryCard({
  item,
  selected,
  onSelect,
  onAssign,
  onRemove,
}: GalleryCardProps) {
  const sourceId = item.file.source_id;
  const { ref, near } = useNearViewport<HTMLLIElement>();
  const { url, failed } = useThumbnail(sourceId, near);

  return (
    <li ref={ref} className="group relative">
      <button
        type="button"
        role="option"
        aria-selected={selected}
        data-selected={selected}
        onClick={onSelect}
        // Con su propio `sourceId`, no con la selección: el `dblclick` viene
        // después de dos `click`, así que si dependiera de la selección
        // asociaría el archivo equivocado justo cuando el operador apuró.
        onDoubleClick={onAssign}
        title={`Ver ${item.file.file_name}`}
        className={cn(
          'flex w-full flex-col overflow-hidden rounded-md border bg-card text-left transition-colors focus-visible:outline-none',
          selected
            ? 'border-primary ring-2 ring-primary'
            : 'border-border hover:border-primary'
        )}
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
/* Vista previa                                                        */
/* ------------------------------------------------------------------ */

interface PreviewPaneProps {
  item: ValidatedFileItem | null;
  onAssign: () => void;
  onRemove: (() => void) | undefined;
}

function PreviewPane({ item, onAssign, onRemove }: PreviewPaneProps) {
  return (
    <>
      <DocumentPreview
        sourceId={item?.file.source_id ?? ''}
        fileName={item?.file.file_name ?? ''}
        className="max-h-[28vh] min-h-32 md:max-h-[56vh]"
        failedNote="No se puede mostrar esta vista previa. Si el archivo está bien, igual podés asociarlo."
      />

      {item !== null && (
        <div className="border-t border-border p-3">
          <p className="truncate font-data text-xs font-medium text-foreground">
            {item.file.file_name}
          </p>

          {/* El destino —expediente y tipo de documento— está en la cabecera,
              arriba a la derecha, justo sobre este panel. Repetirlo acá
              aligeraba el botón ("Asociar" y no "Asociar a 900220720") pero
              dejaba la decisión con el destino a media pantalla de distancia,
              que es justo cuando un clic de más carga el DNI de otra persona. */}
          <Button size="sm" className="mt-2.5 w-full" onClick={onAssign}>
            Asociar
          </Button>

          <div className="mt-1.5 flex items-center gap-2">
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="text-xs text-error"
              >
                Sacar del lote
              </Button>
            )}
            <p className="ml-auto text-[10px] text-muted-foreground">
              Doble clic o Enter también asocia
            </p>
          </div>
        </div>
      )}
    </>
  );
}
