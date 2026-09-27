'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ImageOff,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

import {
  assignProblem,
  composeFileName,
  type ValidatedFileItem,
} from '../../hooks/use-batch-file-validation';

const DATALIST_ID = 'dossier-keys-for-assign';

export interface DocumentViewerDialogProps {
  /** Archivo a ver. `null` mantiene el diálogo cerrado. */
  item: ValidatedFileItem | null;
  /** Claves de agrupación ya presentes en el lote, para autocompletar. */
  knownKeys: string[];
  /** Códigos válidos de la actividad. */
  codes: string[];
  /** Código -> nombre del documento, para etiquetar los botones. */
  codeNames: Record<string, string>;
  /**
   * Values with which the dialog opens. Used when the operator clicks an empty
   * slot instead of dragging: the dossier and document type are already
   * decided, so only the file is missing.
   */
  presetKey?: string;
  presetCode?: string;
  onApply: (sourceId: string, key: string, code: string) => void;
  onRemove: (sourceId: string) => void;
  onClose: () => void;
}

/**
 * Ver el archivo y, si hace falta, decidir a qué expediente va.
 *
 * Tiene **dos formas** según si hay algo pendiente:
 *
 * - Con algo que decidir (el archivo no tiene expediente, o su tipo no existe
 *   en la actividad) abre el formulario completo.
 * - Con la asignación ya resuelta —viene de un clic en un hueco, o de un clic en
 *   un chip ya ocupado— abre como visor: la imagen grande y una barra con
 *   "90093246 · DNI Apoderado" y un botón *Cambiar* que despliega el
 *   formulario en el lugar. Antes era un formulario entero con la clave
 *   bloqueada y un mensaje que mandaba a quitar el archivo del lote para
 *   cambiarlo, cuando el tablero ya lo resuelve con arrastrarlo a otro hueco.
 *
 * La clave nunca se bloquea. Cambiarla es editar un campo, y el tablero
 * reagrupa solo; el que no debía offers un cambio accidental era el formulario
 * entero en pantalla, y eso se resuelve mostrando la barra primero.
 *
 * La imagen se monta **solo** mientras el diálogo está abierto: el contenido del
 * diálogo no existe en el DOM cuando `item` es `null`, así que con 200 archivos
 * en la bandeja no se baja ni una miniatura. Es a propósito — el operador
 * elige un archivo, lo mira, lo asigna y sigue; cargar las 141 fotos de una vez
 * lo que hace es vaciar la memoria del navegador y trabar la pantalla.
 */
export function DocumentViewerDialog({
  item,
  knownKeys,
  codes,
  codeNames,
  presetKey,
  presetCode,
  onApply,
  onRemove,
  onClose,
}: DocumentViewerDialogProps) {
  // Borrador de la asignación. La identidad del borrador incluye el prellenado
  // para que al abrir el mismo archivo con otro destino el formulario empiece
  // de cero, sin necesidad de un efecto. `expanded` viaja en el mismo objeto
  // por lo mismo: si no, cambiar de archivo dejaría el formulario abierto.
  const [draft, setDraft] = useState<{
    identity: string;
    key: string;
    code: string;
    expanded: boolean;
  } | null>(null);

  const sourceId = item?.file.source_id ?? '';
  const identity = `${sourceId}|${presetKey ?? ''}|${presetCode ?? ''}`;

  const decided = {
    key: presetKey ?? item?.dni ?? '',
    code: presetCode ?? item?.code ?? '',
  };

  const current =
    draft && draft.identity === identity
      ? draft
      : {
          identity,
          ...decided,
          // Si el tipo no existe en la actividad hay algo roto que mirar, así
          // que el formulario se abre solo en vez de mandar al operador a
          // descubrir que tiene que apretar "Cambiar".
          expanded:
            !decided.key ||
            (decided.code !== '' && !codes.includes(decided.code)),
        };

  // Estados de la imagen sin `useEffect`: se comparan contra la URL actual, así
  // que cambian solos al abrir otro archivo.
  const imageUrl = item
    ? `/api/drive-image?id=${encodeURIComponent(item.file.source_id)}&sz=w1600`
    : '';
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);
  const imageReady = loadedUrl === imageUrl;
  const imageBroken = brokenUrl === imageUrl;

  const problem = assignProblem(
    current.key,
    current.code,
    item?.file.file_name ?? '',
    codes
  );
  const composedName = composeFileName(
    current.key,
    current.code,
    item?.file.file_name ?? ''
  );

  // Si el nombre que se va a mandar es el mismo que ya tiene, no hay nada que
  // confirmar: el diálogo es un visor y alcanza con cerrarlo.
  const isPending = composedName !== (item?.file.file_name ?? '') || problem !== null;

  // Estado "ya resuelto" al que volver: solo existe si el archivo ya venía bien
  // asignado. Si lo que hay que corregir es justamente la asignación, no hay
  // nada a qué cancelar.
  const resolved = Boolean(
    decided.key &&
      decided.code &&
      codes.includes(decided.code) &&
      assignProblem(decided.key, decided.code, item?.file.file_name ?? '', codes) ===
        null
  );

  const patch = (next: Partial<typeof current>) => setDraft({ ...current, ...next });
  const setKey = (key: string) => patch({ key: key.toUpperCase() });
  const setCode = (code: string) => patch({ code });
  /** Vuelve a la asignación real del archivo, descartando lo editado. */
  const collapse = () => setDraft({ identity, ...decided, expanded: false });

  return (
    <Dialog open={item !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border p-4">
          <DialogTitle className="truncate font-data text-base">
            {item?.file.file_name}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {current.expanded
              ? 'Revisá el documento y decidí a qué expediente pertenece.'
              : 'Revisá que el documento sea de esta persona.'}
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            'grid max-h-[72vh] overflow-y-auto',
            imageBroken ? 'grid-cols-1' : 'md:grid-cols-[1fr_290px]'
          )}
        >
          {/* Archivo. El <img> existe únicamente con el diálogo abierto. Si la
              vista previa no se puede obtener, el panel entero se va: media
              pantalla de negro con una línea de error no es una pantalla de
              trabajo. El guard por `imageUrl` además evita el `<img src="">`
              que queda durante la animación de salida, cuando `item` ya es
              `null` pero el popup sigue en el DOM. */}
          {imageUrl && !imageBroken && (
            <div className="relative flex min-h-56 items-center justify-center bg-slate-900 p-3">
              {!imageReady && (
                <span className="absolute flex items-center gap-2 font-data text-xs text-slate-300">
                  <Loader2 className="size-4 animate-spin" />
                  Cargando archivo…
                </span>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element -- proxy
                  propio de Drive que ya devuelve la imagen al tamaño pedido;
                  `next/image` solo agregaría una vuelta por el optimizador. */}
              <img
                src={imageUrl}
                alt={item?.file.file_name ?? ''}
                onLoad={() => setLoadedUrl(imageUrl)}
                onError={() => setBrokenUrl(imageUrl)}
                className={cn(
                  'max-h-[68vh] w-auto max-w-full object-contain',
                  imageReady ? 'opacity-100' : 'opacity-0'
                )}
              />
            </div>
          )}

          {imageBroken && (
            <p className="flex items-center gap-2 border-b border-border bg-warning-light px-4 py-2 text-[11px] text-warning-dark">
              <ImageOff className="size-3.5 shrink-0" />
              No se pudo ver este archivo. Si reconocés el nombre, podés
              cargarlo igual.
            </p>
          )}

          {/* Controles de asignación */}
          <div
            className={cn(
              'flex flex-col gap-4 p-4',
              !imageBroken && 'md:border-l md:border-border',
              !current.expanded && 'gap-3'
            )}
          >
            {!current.expanded ? (
              /* Todo resuelto: la asignación a la vista y un solo camino para
                 cambiar algo. Nada de un campo de solo lectura que no lleva a
                 ninguna parte. */
              <div className="flex flex-col gap-2">
                <div className="rounded-lg border border-border bg-muted/50 px-3 py-2.5">
                  <p className="text-[11px] text-muted-foreground">
                    Asignado a este expediente
                  </p>
                  <p className="font-data text-sm font-semibold text-foreground">
                    {current.key || '—'}
                    <span className="mx-1.5 font-sans font-normal text-muted-foreground">
                      ·
                    </span>
                    <span className="font-sans font-medium">
                      {codeNames[current.code] ?? current.code}
                    </span>
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => patch({ expanded: true })}
                  className="self-start"
                >
                  <Pencil className="size-3.5" />
                  Cambiar
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="assign-key" className="text-xs">
                    Expediente
                  </Label>
                  <Input
                    id="assign-key"
                    list={DATALIST_ID}
                    inputMode="numeric"
                    value={current.key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="DNI del beneficiario"
                    aria-describedby="assign-key-help"
                  />
                  <datalist id={DATALIST_ID}>
                    {knownKeys.map((key) => (
                      <option key={key} value={key} />
                    ))}
                  </datalist>
                  <p id="assign-key-help" className="text-[11px] text-muted-foreground">
                    Es el número que junta los documentos de una misma persona.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Tipo de documento</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {codes.map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setCode(code)}
                        aria-pressed={current.code === code}
                        title={codeNames[code]}
                        className={cn(
                          'rounded-md border px-2 py-1 font-data text-xs font-semibold transition-colors',
                          current.code === code
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent'
                        )}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                  {current.code && codeNames[current.code] && (
                    <p className="text-[11px] text-muted-foreground">
                      {codeNames[current.code]}
                    </p>
                  )}
                </div>

                {/* Vista previa del nombre resultante: el operador ve
                    exactamente lo que se va a mandar al backend antes de
                    confirmarlo. Con la asignación ya resuelta no se muestra
                    para nada —sería un texto derivado que no puede cambiar. */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Se va a guardar como</Label>
                  <code className="rounded-md border border-border bg-muted/50 px-2 py-1.5 font-data text-xs break-all">
                    {composedName}
                  </code>
                  {problem ? (
                    <p className="flex items-start gap-1.5 text-[11px] text-destructive">
                      <AlertTriangle className="mt-px size-3 shrink-0" />
                      {problem}
                    </p>
                  ) : (
                    <p className="flex items-start gap-1.5 text-[11px] text-success-dark">
                      <CheckCircle2 className="mt-px size-3 shrink-0" />
                      Listo para subir.
                    </p>
                  )}
                </div>

                {resolved && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={collapse}
                      className="text-xs text-muted-foreground"
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Acciones. "Quitar del lote" va separado y Chico: es
                destructivo —se pierde la foto para todo el lote— y no puede
                quedar del mismo tamaño al lado de "Guardar". */}
            <div className="mt-auto flex flex-col gap-2 border-t border-border pt-3">
              {isPending ? (
                <Button
                  size="sm"
                  disabled={problem !== null}
                  onClick={() => onApply(sourceId, current.key, current.code)}
                >
                  <CheckCircle2 className="size-4" />
                  Guardar
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={onClose}>
                  Cerrar
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-muted-foreground hover:bg-error-light hover:text-error"
                onClick={() => onRemove(sourceId)}
              >
                <Trash2 className="size-3.5" />
                Quitar del lote
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
