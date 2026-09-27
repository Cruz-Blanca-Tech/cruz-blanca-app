'use client';

import { useMemo, useState, type DragEvent, type ReactNode } from 'react';
import { toast } from 'sonner';

import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileText,
  FileWarning,
  Hand,
  Info,
  Trash2,
  Users,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type {
  BatchValidationResult,
  DossierGroup,
  ValidatedFileItem,
} from '../../hooks/use-batch-file-validation';
import {
  DocumentViewerDialog,
  type AssignmentDestination,
} from './document-viewer-dialog';
import { SlotGalleryDialog } from './slot-gallery-dialog';

/**
 * MIME propio para el arrastre. Usar `text/plain` haría que el navegador
 * permitiera soltar el archivo fuera de la aplicación, y `dragover` no nos da
 * control sobre eso.
 */
const DRAG_MIME = 'application/x-cruz-document';

type BoardFilter = 'all' | 'incomplete' | 'nonDni';

interface DossierBoardProps {
  validation: BatchValidationResult;
  /**
   * Coloca un archivo en un expediente con un tipo de documento.
   *
   * Devuelve `false` si el cambio no se pudo aplicar, para que el tablero
   * pueda avisar en vez de fingir que la ranura quedó ocupada.
   */
  onAssign: (sourceId: string, key: string, code: string) => boolean;
  /**
   * Devuelve un archivo a la bandeja restaurando su nombre original.
   *
   * Devuelve `false` cuando no hay un nombre al cual volver: un archivo que
   * ya venía de Drive con nombre `CLAVE_CODIGO.ext` no tiene otro nombre, así
   * que "desasignarlo" no significa nada y hay que quitarlo del lote.
   */
  onUnassign: (sourceId: string) => boolean;
  onRemoveFile: (sourceId: string) => void;
  /** Si el archivo tiene un nombre al cual volver, distinto del actual. */
  canUnassign: (sourceId: string) => boolean;
  /**
   * Abre el selector de Google Drive. Lo llama la galería de huecos, que tiene
   * su propio botón "Agregar desde Drive" para el caso de que el archivo que
   * falta ni siquiera haya entrado al lote.
   */
  onRequestDrive?: () => void;
  disabled?: boolean;
}

/** Un destino de arrastre: una ranura de un expediente. */
interface Slot {
  key: string;
  code: string;
  id: string;
}

/**
 * Tablero de expedientes con la bandeja de archivos sin destino al lado.
 *
 * Reemplaza a las dos listas apiladas de antes (archivos inválidos, avisos de
 * clave no-DNI, expedientes). Con 233 archivos esas tres listas ocupaban cinco
 * pantallas de scroll y lo accionable —los 7 documentos que faltan— quedaba
 * abajo del todo. Acá la pantalla no crece: cada panel scrollea solo.
 */
export function DossierBoard({
  validation,
  onAssign,
  onUnassign,
  onRemoveFile,
  canUnassign,
  onRequestDrive,
  disabled = false,
}: DossierBoardProps) {
  const [viewer, setViewer] = useState<{
    item: ValidatedFileItem;
    presetKey?: string;
    presetCode?: string;
  } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverSlot, setHoverSlot] = useState<string | null>(null);
  const [filter, setFilter] = useState<BoardFilter>('all');
  /**
   * Hueco que se está completando a mano (sin arrastrar). Al elegirlo se abre
   * la galería con los archivos sin expediente para elegir la foto.
   */
  const [gallerySlot, setGallerySlot] = useState<Slot | null>(null);

  const {
    dossierGroups,
    requiredCodes,
    optionalCodes,
    codeNames,
    unassignedFiles,
    misCodedFiles,
    unsupportedFiles,
    completeDossierCount,
    dossierCount,
    nonDniKeyCount,
    hasIncompleteDossiers,
  } = validation;

  // Los expedientes incompletos primero: son los únicos que bloquean, y con 25
  // filas el operador no debería tener que buscarlos.
  const orderedGroups = useMemo(
    () =>
      [...dossierGroups].sort((a, b) => {
        if (a.isComplete !== b.isComplete) return a.isComplete ? 1 : -1;
        return a.dni.localeCompare(b.dni);
      }),
    [dossierGroups]
  );

  const visibleGroups = useMemo(() => {
    if (filter === 'incomplete') return orderedGroups.filter((g) => !g.isComplete);
    if (filter === 'nonDni') return orderedGroups.filter((g) => !g.isDni);
    return orderedGroups;
  }, [orderedGroups, filter]);

  const missingSlotCount = dossierGroups.reduce(
    (total, group) => total + group.missingCodes.length,
    0
  );
  const incompleteCount = dossierCount - completeDossierCount;
  const knownKeys = useMemo(() => dossierGroups.map((g) => g.dni), [dossierGroups]);
  /**
   * Los huecos que hay que llenar, para ofrecerlos como destino dentro del
   * visor. Sale del mismo `orderedGroups` que el tablero, así la lista del
   * diálogo y las filas de arriba cuentan la misma historia en el mismo orden:
   * primero los expedientes que bloquean el lote.
   *
   * Solo huecos libres: los preoccupied no van, porque "cambiar el tipo de un
   * archivo que ya está asignado" se resuelve en el formulario de abajo, que
   * viene con la clave y el tipo cargados y es cambiar un chip.
   */
  const destinations = useMemo<AssignmentDestination[]>(
    () =>
      orderedGroups.flatMap((group) =>
        group.missingCodes.map((code) => ({ key: group.dni, code }))
      ),
    [orderedGroups]
  );
  const allCodes = useMemo(
    () => [...requiredCodes, ...optionalCodes],
    [requiredCodes, optionalCodes]
  );

  // Bandeja: primero lo que se arregla con un clic, después el resto.
  const fixable = useMemo(
    () =>
      [...misCodedFiles].sort(
        (a, b) =>
          Number(Boolean(b.fix?.suggestedCode)) -
          Number(Boolean(a.fix?.suggestedCode))
      ),
    [misCodedFiles]
  );

  /**
   * Si los N archivos de un grupo comparten el mismo motivo, no se lo repetimos
   * a cada fila: con 135 fotos sin nombre, el mismo texto 135 veces era
   * justamente la pared de texto que tapaba todo lo accionable. El texto del
   * encabezado del grupo ya lo dice, y el `title` de cada fila lo conserva para
   * quien pase el mouse por encima.
   */
  const reasonIsUniform = (files: ValidatedFileItem[]) =>
    new Set(files.map((f) => f.errorReason ?? '')).size <= 1;

  const startDrag = (event: DragEvent, sourceId: string) => {
    event.dataTransfer.setData(DRAG_MIME, sourceId);
    event.dataTransfer.effectAllowed = 'move';
    setDraggingId(sourceId);
  };

  const endDrag = () => {
    setDraggingId(null);
    setHoverSlot(null);
  };

  const occupantOf = (slot: Slot) =>
    dossierGroups
      .find((g) => g.dni === slot.key)
      ?.files.find((f) => f.code === slot.code);

  /**
   * Coloca un archivo en una ranura.
   *
   * Si la ranura ya estaba ocupada, el ocupante vuelve a la bandeja con su
   * nombre original: es un intercambio reversible, no una pérdida. Pero eso
   * solo funciona si el ocupante tiene un nombre al cual volver. Un archivo que
   * ya venía de Drive como `CLAVE_CODIGO.ext` no lo tiene —su propio nombre ES
   * la asignación—, y "sacarlo" de la ranura no lo dejaría sin destino, lo
   * dejaría igual de válido y con dos archivos de mismo nombre. En ese caso
   * se rechaza el movimiento y se dice por qué, en vez de duplicar en
   * silencio.
   */
  /**
   * El hueco siguiente en la lista, para dejar la galería abierta en él.
   *
   * El operador suele tener un montoncito de fotos para varios huecos de la
   * misma actividad. Si la galería se cerrara en cada elección, llenar ocho
   * huecos serían ocho ciclos de abrir, elegir, cerrar y volver a hacer clic en
   * la fila. Con esto sigue abierta y el título pasa al hueco que sigue.
   */
  const nextHoleAfter = (placed: Slot) => {
    const i = destinations.findIndex(
      (d) => d.key === placed.key && d.code === placed.code
    );
    if (i < 0 || i + 1 >= destinations.length) return null;
    const next = destinations[i + 1];
    return { ...next, id: `${next.key}|${next.code}` };
  };

  const place = (sourceId: string, slot: Slot) => {
    const occupant = occupantOf(slot);

    if (occupant && occupant.file.source_id !== sourceId) {
      if (!canUnassign(occupant.file.source_id)) {
        toast.error(
          `${slot.code} de ${slot.key} ya está ocupado por ${occupant.file.file_name}. ` +
            `Sacalo del lote con la ✕ si no lo querés, y después traé el otro.`
        );
        return;
      }
      onUnassign(occupant.file.source_id);
    }

    if (!onAssign(sourceId, slot.key, slot.code)) {
      toast.error('No se pudo asignar ese archivo. Revisá el nombre.');
      return;
    }
    setGallerySlot(nextHoleAfter(slot));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* ================= EXPEDIENTES ================= */}
      <section className="flex min-w-0 flex-col rounded-lg border border-border bg-card">
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border p-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <h3 className="font-heading text-sm font-semibold text-foreground">
              Expedientes
            </h3>
            <span className="font-data text-xs text-muted-foreground">
              {completeDossierCount} de {dossierCount} completos
            </span>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-1">
            <FilterChip
              active={filter === 'all'}
              onClick={() => setFilter('all')}
              label={`Todos (${dossierCount})`}
            />
            {incompleteCount > 0 && (
              <FilterChip
                active={filter === 'incomplete'}
                onClick={() => setFilter('incomplete')}
                label={`Faltan documentos (${incompleteCount})`}
                tone="destructive"
              />
            )}
            {nonDniKeyCount > 0 && (
              <FilterChip
                active={filter === 'nonDni'}
                onClick={() => setFilter('nonDni')}
                label={`Clave no DNI (${nonDniKeyCount})`}
                tone="warning"
              />
            )}
          </div>
        </header>

        {/* Mismo tope que la bandeja de la derecha: si difieren, el `grid`
            los estira a la altura del más alto y la columna más corta queda
            con un hueco vacío al pie. */}
        <div className="max-h-[30rem] overflow-y-auto p-2">
          {visibleGroups.length === 0 ? (
            <p className="px-2 py-8 text-center text-xs text-muted-foreground">
              No hay expedientes que coincidan con este filtro.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {visibleGroups.map((group) => (
                <DossierRow
                  key={group.dni}
                  group={group}
                  requiredCodes={requiredCodes}
                  optionalCodes={optionalCodes}
                  codeNames={codeNames}
                  // Mientras se arrastra, todos los huecos se marcan como
                  // destino posible.
                  dragging={draggingId !== null}
                  hoverSlot={hoverSlot}
                  disabled={disabled}
                  onHoverSlot={(slot, over) =>
                    setHoverSlot(over ? slot.id : null)
                  }
                  onDrop={(slot) => {
                    if (draggingId) place(draggingId, slot);
                    endDrag();
                  }}
                  onPickSlot={(slot) => setGallerySlot(slot)}
                  onViewFile={(item) => setViewer({ item })}
                  onRemoveFile={onRemoveFile}
                  canUnassign={canUnassign}
                />
              ))}
            </ul>
          )}
        </div>

        {hasIncompleteDossiers && (
          <footer className="flex items-start gap-2 border-t border-border bg-destructive/5 p-3 text-xs text-destructive">
            <AlertTriangle className="mt-px size-4 shrink-0" />
            <p>
              <strong className="font-semibold">
                Faltan {missingSlotCount} documentos.
              </strong>{' '}
              Arrastrá un archivo de la bandeja al hueco marcado, o hacé clic en
              el hueco para ver las fotos y elegir una. También podés quitar el
              expediente entero con la ✕ y seguir sin él.
            </p>
          </footer>
        )}
      </section>

      {/* ================= BANDEJA ================= */}
      <aside className="flex min-w-0 flex-col rounded-lg border border-border bg-card">
        <header className="flex flex-col gap-2 border-b border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-heading text-sm font-semibold text-foreground">
              Archivos sin destino
            </h3>
            <span className="font-data text-xs text-muted-foreground">
              {unassignedFiles.length + misCodedFiles.length + unsupportedFiles.length}
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Estos archivos no se van a subir. Abrilos para ver de qué se trata
            y decidir su expediente, arrastralos a un hueco, o hacé clic en un
            hueco ✗ para elegir la foto de una grilla.
          </p>
        </header>

        <div className="max-h-[30rem] overflow-y-auto p-2">
          {fixable.length === 0 &&
          unassignedFiles.length === 0 &&
          unsupportedFiles.length === 0 ? (
            <p className="flex flex-col items-center gap-1.5 px-2 py-8 text-center text-xs text-success-dark">
              <CheckCircle2 className="size-5" />
              Todos los archivos tienen expediente y tipo de documento.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {fixable.length > 0 && (
                <TrayGroup
                  title="Código a corregir"
                  hint="Ya sabemos a qué expediente pertenecen; solo el tipo de documento está mal."
                  tone="destructive"
                >
                  {fixable.map((item) => (
                    <FixableRow
                      key={item.file.source_id}
                      item={item}
                      disabled={disabled}
                      onFix={
                        item.fix?.suggestedCode && item.dni
                          ? () =>
                              place(item.file.source_id, {
                                key: item.dni as string,
                                code: item.fix!.suggestedCode as string,
                                id: `${item.dni}|${item.fix!.suggestedCode}`,
                              })
                          : undefined
                      }
                      onView={() => setViewer({ item, presetKey: item.dni ?? '' })}
                      onRemove={() => onRemoveFile(item.file.source_id)}
                    />
                  ))}
                </TrayGroup>
              )}

              {unassignedFiles.length > 0 && (
                <TrayGroup
                  title="Sin expediente"
                  hint="No se sabe de quién son. Abrilos para ver la foto y elegir expediente y tipo."
                  tone="warning"
                >
                  {unassignedFiles.map((item) => (
                    <TrayRow
                      key={item.file.source_id}
                      item={item}
                      dragging={draggingId === item.file.source_id}
                      onDragStart={startDrag}
                      onDragEnd={endDrag}
                      onView={() => setViewer({ item })}
                      onRemove={() => onRemoveFile(item.file.source_id)}
                      highlight={gallerySlot !== null}
                      showReason={!reasonIsUniform(unassignedFiles)}
                      disabled={disabled}
                    />
                  ))}
                </TrayGroup>
              )}

              {unsupportedFiles.length > 0 && (
                <TrayGroup
                  title="Formato no soportado"
                  hint="Renombrarlos no ayuda: hay que volver a exportarlos como JPG, PNG o PDF."
                  tone="muted"
                >
                  {unsupportedFiles.map((item) => (
                    <TrayRow
                      key={item.file.source_id}
                      item={item}
                      onView={() => setViewer({ item })}
                      onRemove={() => onRemoveFile(item.file.source_id)}
                      // Acá el motivo sí varía (`.heic`, `.docx`, sin extensión),
                      // así que se muestra en cada fila.
                      showReason
                      disabled={disabled}
                    />
                  ))}
                </TrayGroup>
              )}
            </div>
          )}
        </div>
      </aside>

      <DocumentViewerDialog
        item={viewer?.item ?? null}
        presetKey={viewer?.presetKey}
        presetCode={viewer?.presetCode}
        knownKeys={knownKeys}
        codes={allCodes}
        codeNames={codeNames}
        destinations={destinations}
        onApply={(sourceId, key, code) => {
          place(sourceId, { key, code, id: `${key}|${code}` });
          setViewer(null);
        }}
        onRemove={(sourceId) => {
          onRemoveFile(sourceId);
          setViewer(null);
        }}
        onClose={() => setViewer(null)}
      />

      {/* La galería se cierra antes de abrir el selector de Drive: son dos
          modales y apilados se pisan el foco y el `Esc` del de abajo no llega. */}
      <SlotGalleryDialog
        slot={gallerySlot}
        candidates={unassignedFiles}
        codeNames={codeNames}
        onPick={(sourceId) => {
          if (gallerySlot) {
            place(sourceId, {
              key: gallerySlot.key,
              code: gallerySlot.code,
              id: gallerySlot.id,
            });
          }
        }}
        onRemove={(sourceId) => onRemoveFile(sourceId)}
        onAddFromDrive={() => {
          setGallerySlot(null);
          onRequestDrive?.();
        }}
        onClose={() => setGallerySlot(null)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Expediente                                                          */
/* ------------------------------------------------------------------ */

interface DossierRowProps {
  group: DossierGroup;
  requiredCodes: string[];
  optionalCodes: string[];
  codeNames: Record<string, string>;
  dragging: boolean;
  hoverSlot: string | null;
  disabled: boolean;
  onHoverSlot: (slot: Slot, over: boolean) => void;
  onDrop: (slot: Slot) => void;
  onPickSlot: (slot: Slot) => void;
  onViewFile: (item: ValidatedFileItem) => void;
  onRemoveFile: (sourceId: string) => void;
  canUnassign: (sourceId: string) => boolean;
}

function DossierRow({
  group,
  requiredCodes,
  optionalCodes,
  codeNames,
  dragging,
  hoverSlot,
  disabled,
  onHoverSlot,
  onDrop,
  onPickSlot,
  onViewFile,
  onRemoveFile,
  canUnassign,
}: DossierRowProps) {
  // Cada ranura existe siempre, ocupe o no, para que el orden de lectura sea
  // estable: el ojo compara dos expedientes sin tener que buscar los huecos.
  const slots: Array<{ code: string; file: ValidatedFileItem | undefined; required: boolean }> = [
    ...requiredCodes.map((code) => ({
      code,
      file: group.files.find((f) => f.code === code),
      required: true,
    })),
    ...optionalCodes.map((code) => ({
      code,
      file: group.files.find((f) => f.code === code),
      required: false,
    })),
    ...group.extraCodes.map((code) => ({
      code,
      file: group.files.find((f) => f.code === code),
      required: false,
    })),
  ];

  return (
    <li
      className={cn(
        'flex flex-col gap-1.5 rounded-md border px-2.5 py-2 transition-colors',
        group.isComplete
          ? 'border-border bg-card'
          : 'border-destructive/30 bg-destructive/5'
      )}
    >
      <div className="flex items-center gap-2">
        <FileText
          className={cn(
            'size-3.5 shrink-0',
            group.isComplete ? 'text-muted-foreground' : 'text-destructive'
          )}
        />
        <span className="font-data text-xs font-bold text-foreground">
          {group.isDni ? `DNI ${group.dni}` : `Clave ${group.dni}`}
        </span>
        {!group.isDni && (
          <span
            className="rounded border border-warning/50 bg-warning/10 px-1 py-px font-sans text-[9.5px] font-semibold text-warning-dark"
            title="No parece un DNI (no tiene 8 dígitos). Solo sirve para agrupar los archivos: en Triaje se muestra como identificador, no como DNI."
          >
            no es DNI
          </span>
        )}
        <span
          className={cn(
            'ml-auto font-data text-[10px] tabular-nums',
            group.isComplete ? 'text-success-dark' : 'text-destructive'
          )}
        >
          {group.totalPresent}/{group.totalRequired}
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => group.files.forEach((f) => onRemoveFile(f.file.source_id))}
          title="Quitar el expediente entero del lote"
          aria-label={`Quitar el expediente ${group.dni}`}
          className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-error-light hover:text-error disabled:pointer-events-none disabled:opacity-50"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {slots.map(({ code, file, required }) => {
          const slot: Slot = { key: group.dni, code, id: `${group.dni}|${code}` };
          const isHovered = hoverSlot === slot.id;

          if (!file) {
            return (
              <button
                key={code}
                type="button"
                disabled={disabled}
                onClick={() => onPickSlot(slot)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  onHoverSlot(slot, true);
                }}
                onDragLeave={() => onHoverSlot(slot, false)}
                onDrop={(e) => {
                  e.preventDefault();
                  onDrop(slot);
                }}
                title={`Falta ${codeNames[code] ?? code}. Hacé clic para ver las fotos de los archivos sueltos y elegir una, o arrastralo acá.`}
                className={cn(
                  'rounded border border-dashed px-1.5 py-0.5 font-data text-[10px] font-medium transition-colors',
                  dragging
                    ? 'border-primary bg-primary/10 text-primary hover:bg-primary/25'
                    : 'border-destructive/50 bg-destructive/5 text-destructive hover:bg-destructive/15',
                  isHovered && 'border-solid border-primary bg-primary text-primary-foreground'
                )}
              >
                ✗ {code}
              </button>
            );
          }

          return (
            <button
              key={code}
              type="button"
              disabled={disabled}
              onClick={() => onViewFile(file)}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                onHoverSlot(slot, true);
              }}
              onDragLeave={() => onHoverSlot(slot, false)}
              onDrop={(e) => {
                e.preventDefault();
                onDrop(slot);
              }}
              title={`${codeNames[code] ?? code} — ${file.file.file_name}. Clic para ver o cambiar el tipo de documento; ${
                canUnassign(file.file.source_id)
                  ? 'arrastrá otro archivo acá para reemplazarlo.'
                  : 'para reemplazarlo, primero sacá este del lote con la ✕.'
              }`}
              className={cn(
                'rounded border px-1.5 py-0.5 font-data text-[10px] font-medium transition-colors',
                required
                  ? 'border-success/40 bg-success/15 text-success-dark hover:bg-success/25'
                  : 'border-border bg-muted text-muted-foreground hover:bg-accent',
                dragging && 'border-dashed hover:border-primary hover:bg-primary/10',
                isHovered && 'border-solid border-primary bg-primary text-primary-foreground'
              )}
            >
              ✓ {code}
            </button>
          );
        })}
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Bandeja                                                             */
/* ------------------------------------------------------------------ */

function TrayGroup({
  title,
  hint,
  tone,
  children,
}: {
  title: string;
  hint: string;
  tone: 'destructive' | 'warning' | 'muted';
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <header>
        <h4
          className={cn(
            'font-data text-[11px] font-semibold',
            tone === 'destructive' && 'text-destructive',
            tone === 'warning' && 'text-warning-dark',
            tone === 'muted' && 'text-muted-foreground'
          )}
        >
          {title}
        </h4>
        <p className="text-[10.5px] leading-snug text-muted-foreground">{hint}</p>
      </header>
      <ul className="flex flex-col gap-1">{children}</ul>
    </section>
  );
}

function TrayRow({
  item,
  dragging = false,
  highlight = false,
  showReason = true,
  onDragStart,
  onDragEnd,
  onView,
  onRemove,
  disabled,
}: {
  item: ValidatedFileItem;
  dragging?: boolean;
  highlight?: boolean;
  showReason?: boolean;
  onDragStart?: (event: DragEvent, sourceId: string) => void;
  onDragEnd?: () => void;
  onView: () => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  return (
    <li
      draggable={Boolean(onDragStart) && !disabled}
      onDragStart={
        onDragStart ? (e) => onDragStart(e, item.file.source_id) : undefined
      }
      onDragEnd={onDragEnd}
      className={cn(
        'group flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5 transition-colors',
        onDragStart && !disabled && 'cursor-grab active:cursor-grabbing',
        dragging && 'opacity-40',
        highlight && 'border-primary/50 bg-primary/5'
      )}
    >
      {onDragStart && (
        <Hand className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      )}
      <button
        type="button"
        onClick={onView}
        disabled={disabled}
        className="min-w-0 flex-1 text-left"
        title={`${item.file.file_name} — ${item.errorReason ?? ''}`}
      >
        <span className="block truncate font-data text-[11px] text-foreground">
          {item.file.file_name}
        </span>
        {showReason && item.errorReason && (
          <span className="block truncate text-[10.5px] text-muted-foreground">
            {item.errorReason}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={onView}
        disabled={disabled}
        title="Ver el archivo"
        aria-label={`Ver ${item.file.file_name}`}
        className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
      >
        <Eye className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        title="Quitar del lote"
        aria-label={`Quitar ${item.file.file_name}`}
        className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-error-light hover:text-error disabled:pointer-events-none disabled:opacity-50"
      >
        <Trash2 className="size-3.5" />
      </button>
    </li>
  );
}

/** Archivo con clave correcta y código equivocado, con el arreglo de un clic. */
function FixableRow({
  item,
  onFix,
  onView,
  onRemove,
  disabled,
}: {
  item: ValidatedFileItem;
  onFix: (() => void) | undefined;
  onView: () => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  const missing = item.fix?.missingCodes ?? [];
  const missingCount = missing.length;

  return (
    <li className="flex flex-col gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1.5">
      <div className="flex items-center gap-1.5">
        <FileWarning className="size-3 shrink-0 text-destructive" />
        <button
          type="button"
          onClick={onView}
          disabled={disabled}
          className="min-w-0 flex-1 truncate text-left font-data text-[11px] text-foreground"
          title={item.errorReason}
        >
          {item.file.file_name}
        </button>
        <button
          type="button"
          onClick={onView}
          disabled={disabled}
          title="Ver el archivo"
          aria-label={`Ver ${item.file.file_name}`}
          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          <Eye className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          title="Quitar del lote"
          aria-label={`Quitar ${item.file.file_name}`}
          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-error-light hover:text-error disabled:pointer-events-none disabled:opacity-50"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {onFix ? (
        <Button
          type="button"
          size="sm"
          disabled={disabled}
          onClick={onFix}
          className="h-6 justify-start gap-1.5 px-2 text-[10.5px]"
        >
          <CheckCircle2 className="size-3" />
          <span className="font-mono">
            {item.dni}_{item.fix?.suggestedCode}
          </span>
          <span className="truncate font-sans font-normal opacity-80">
            completa el expediente
          </span>
        </Button>
      ) : (
        <p className="flex items-start gap-1 text-[10.5px] text-muted-foreground">
          <Info className="mt-px size-3 shrink-0" />
          {missingCount === 0 ? (
            <span>
              El expediente {item.dni} ya está completo, así que este archivo
              sobra o es de otra persona. Abrilo para ver de qué se trata.
            </span>
          ) : (
            <span>
              A {item.dni} le falta{missingCount > 1 ? 'n' : ''}{' '}
              {missingCount > 1 ? 'varios documentos' : 'un documento'} (
              {missing.join(', ')}) y no se puede deducir cuál es.{' '}
              Abrilo para ver la foto y elegir el tipo.
            </span>
          )}
        </p>
      )}
    </li>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  tone = 'default',
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  tone?: 'default' | 'destructive' | 'warning';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-md border px-2 py-0.5 font-data text-[11px] transition-colors',
        active && tone === 'default' && 'border-primary bg-primary text-primary-foreground',
        active && tone === 'destructive' && 'border-destructive bg-destructive text-white',
        active && tone === 'warning' && 'border-warning bg-warning text-warning-dark',
        !active && 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}
