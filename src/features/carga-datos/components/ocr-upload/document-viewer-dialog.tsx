'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, ImageOff, Loader2, Trash2 } from 'lucide-react';

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
   * Fija la clave y la muestra como texto. Se usa cuando el archivo ya
   * pertenece a un expediente y lo único que hay que corregir es el código
   * (el caso `90566420_DNIPAPA.jpg`): ofrecerle cambiar el expediente en ese
   * momento solo genera errores.
   */
  lockKey?: boolean;
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
 * Ver el archivo y decidir a qué expediente va.
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
  lockKey = false,
  presetKey,
  presetCode,
  onApply,
  onRemove,
  onClose,
}: DocumentViewerDialogProps) {
  // Borrador de la asignación. La identidad del borrador incluye el prellenado
  // para que al abrir el mismo archivo con otro destino el formulario empiece
  // de cero, sin necesidad de un efecto.
  const [draft, setDraft] = useState<{
    identity: string;
    key: string;
    code: string;
  } | null>(null);

  const sourceId = item?.file.source_id ?? '';
  const identity = `${sourceId}|${presetKey ?? ''}|${presetCode ?? ''}`;
  const current =
    draft && draft.identity === identity
      ? draft
      : {
          identity,
          key: presetKey ?? item?.dni ?? '',
          code: presetCode ?? item?.code ?? '',
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

  const setKey = (key: string) =>
    setDraft({ ...current, key: key.toUpperCase() });
  const setCode = (code: string) => setDraft({ ...current, code });

  return (
    <Dialog open={item !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border p-4">
          <DialogTitle className="truncate font-data text-base">
            {item?.file.file_name}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Revisá el documento y decidí a qué expediente pertenece.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[72vh] grid-cols-1 overflow-y-auto md:grid-cols-[1fr_290px]">
          {/* Archivo. El <img> existe únicamente con el diálogo abierto. */}
          <div className="flex min-h-56 items-center justify-center bg-slate-900 p-3">
            {imageBroken ? (
              <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
                <ImageOff className="size-8" />
                <span className="font-data text-xs">
                  No se pudo obtener una vista previa de este archivo.
                </span>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Controles de asignación */}
          <div className="flex flex-col gap-4 border-t border-border p-4 md:border-t-0 md:border-l">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="assign-key" className="text-xs">
                Expediente
              </Label>
              {lockKey ? (
                <p className="rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 font-data text-sm font-semibold">
                  {current.key || '—'}
                </p>
              ) : (
                <>
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
                </>
              )}
              <p id="assign-key-help" className="text-[11px] text-muted-foreground">
                {lockKey
                  ? 'El archivo ya tiene expediente. Para cambiarlo, quitá el archivo y asignalo de nuevo.'
                  : 'Es el número que junta los documentos de una misma persona.'}
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

            {/* Vista previa del nombre resultante: el operador ve exactamente
                lo que se va a mandar al backend antes de confirmarlo. */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Nombre en el sistema</Label>
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

            <div className="mt-auto flex flex-col gap-2">
              <Button
                size="sm"
                disabled={problem !== null}
                onClick={() => onApply(sourceId, current.key, current.code)}
              >
                <CheckCircle2 className="size-4" />
                Guardar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:bg-error-light hover:text-error"
                onClick={() => onRemove(sourceId)}
              >
                <Trash2 className="size-4" />
                Quitar del lote
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
