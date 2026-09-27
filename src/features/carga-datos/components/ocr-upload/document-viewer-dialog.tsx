'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ImageOff,
  Loader2,
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
import { peekDriveToken } from '@/shared/drive/drive-auth';
import { fetchDriveFileBlob } from '@/shared/drive/drive-api';

import {
  assignProblem,
  composeFileName,
  type ValidatedFileItem,
} from '../../hooks/use-batch-file-validation';

const DATALIST_ID = 'dossier-keys-for-assign';

/** Un hueco libre de un expediente: el destino de un clic. */
export interface AssignmentDestination {
  key: string;
  code: string;
}

export interface DocumentViewerDialogProps {
  /** Archivo a ver. `null` mantiene el diálogo cerrado. */
  item: ValidatedFileItem | null;
  /** Claves de agrupación ya presentes en el lote, para autocompletar. */
  knownKeys: string[];
  /** Códigos válidos de la actividad. */
  codes: string[];
  /** Código -> nombre del documento, para etiquetar los botones. */
  codeNames: Record<string, string>;
  /** Huecos libres del lote, en el mismo orden que los muestra el tablero. */
  destinations: AssignmentDestination[];
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
 * Ver el archivo y decidir dónde va.
 *
 * El orden es el del trabajo: primero **mirar** el documento, después decir
 * **dónde** va. La imagen va arriba y a todo el ancho, que es para eso; la
 * decisión va abajo, sobre una lista de los huecos que están esperando. Elegir
 * un hueco es un clic, contra escribir un número y ubicar un chip.
 *
 * La lista solo ofrece huecos libres, nunca ranuras ocupadas: cambiar el tipo
 * de un archivo que ya está asignado se hace en el formulario de abajo, que
 * viene con la clave y el tipo cargados, así que es cambiar un chip y guardar.
 *
 * La imagen se baja de Drive con el token del usuario. No por el proxy
 * `/api/drive-image`: ese va contra `thumbnail`, que solo responde para
 * archivos públicos, así que con un Drive privado daba 404 en todos los
 * archivos y el operador no veía nada. Solo se pide con el diálogo abierto —no
 * se precargan las 141 fotos— y la object URL se revoca al cerrar.
 */
export function DocumentViewerDialog({
  item,
  knownKeys,
  codes,
  codeNames,
  destinations,
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

  const decided = {
    key: presetKey ?? item?.dni ?? '',
    code: presetCode ?? item?.code ?? '',
  };

  const current =
    draft && draft.identity === identity
      ? draft
      : { identity, ...decided };

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
  const changed = composedName !== (item?.file.file_name ?? '');

  const setKey = (key: string) =>
    setDraft({ ...current, key: key.toUpperCase() });
  const setCode = (code: string) => setDraft({ ...current, code });

  /* Vista previa ------------------------------------------------------- */

  const [objectUrl, setObjectUrl] = useState<{
    sourceId: string;
    url: string;
  } | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);

  useEffect(() => {
    const fileId = item?.file.source_id;
    if (!fileId) return;

    let cancelled = false;
    let created: string | null = null;

    void (async () => {
      // Sin token no se intenta nada: pedirlo abriría una ventana de Google
      // encima del documento (ver `peekDriveToken`).
      const token = peekDriveToken();
      if (!token) {
        setFailedId(fileId);
        return;
      }
      try {
        const blob = await fetchDriveFileBlob(token, fileId);
        if (cancelled) return;
        created = URL.createObjectURL(blob);
        setObjectUrl({ sourceId: fileId, url: created });
      } catch {
        if (!cancelled) setFailedId(fileId);
      }
    })();

    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [item?.file.source_id]);

  const imageSrc = objectUrl?.sourceId === sourceId ? objectUrl.url : null;
  const imageFailed = failedId === sourceId;
  const noDriveSession = !peekDriveToken();

  /* Render -------------------------------------------------------------- */

  return (
    <Dialog open={item !== null} onOpenChange={(next) => !next && onClose()}>
      {/* `sm:max-w-*` y no `max-w-*`: el Popup base trae `sm:max-w-sm`, y una
          variante le gana a la clase sin prefijo. Con `max-w-3xl` a secas el
          diálogo se quedaba en 384px y la imagen no tenía dónde crecer. */}
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border p-4">
          <DialogTitle className="truncate font-data text-base">
            {item?.file.file_name}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {decided.key
              ? 'Revisá que el documento sea de esta persona.'
              : 'Revisá el documento y decidí a qué expediente pertenece.'}
          </DialogDescription>
        </DialogHeader>

        {/* El documento, arriba y a todo el ancho. */}
        {imageSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element -- blob local
              armado con el token de Drive; `next/image` no puede consumir una
              object URL ni ahorra nada porque el optimizador no la bajaría. */
          <img
            src={imageSrc}
            alt={item?.file.file_name ?? ''}
            className="max-h-[50vh] w-full bg-slate-900 object-contain"
          />
        ) : (
          <div className="flex h-40 items-center justify-center bg-slate-900">
            {imageFailed ? (
              <span className="flex max-w-md flex-col items-center gap-1 px-4 text-center font-data text-xs text-slate-400">
                <span className="flex items-center gap-2">
                  <ImageOff className="size-4 shrink-0" />
                  No se pudo ver este archivo.
                </span>
                {noDriveSession ? (
                  <span>
                    Tu sesión de Google Drive venció. Si volvés a agregar
                    archivos desde Drive, las imágenes vuelven a verse.
                  </span>
                ) : (
                  <span>
                    Si reconocés el nombre, podés cargarlo igual.
                  </span>
                )}
              </span>
            ) : (
              <span className="flex items-center gap-2 font-data text-xs text-slate-300">
                <Loader2 className="size-4 animate-spin" />
                Bajando el documento de Drive…
              </span>
            )}
          </div>
        )}

        <div className="max-h-[34vh] overflow-y-auto">
          {/* Dónde está ahora, y que abajo está el reemplazo. */}
          {decided.key && (
            <p className="border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
              Ahora está en{' '}
              <span className="font-data font-semibold text-foreground">
                {decided.key}
              </span>{' '}
              · {codeNames[decided.code] ?? decided.code}.{' '}
              {destinations.length > 0 ? (
                <>
                  Para cambiarlo,{' '}
                  <span className="text-foreground">ponelo en otro lugar</span>{' '}
                  de los de abajo.
                </>
              ) : (
                'Para moverlo de persona o cambiarle el tipo, usá el formulario de abajo.'
              )}
            </p>
          )}

          <div className="flex flex-col gap-4 p-4">
            {/* Destino principal: un clic en el hueco. */}
            {destinations.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  {decided.key ? 'Reemplazarlo en' : 'Ponelo en'}
                </Label>
                <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto">
                  {destinations.map((dest) => (
                    <li key={`${dest.key}|${dest.code}`}>
                      <button
                        type="button"
                        onClick={() => onApply(sourceId, dest.key, dest.code)}
                        className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-left transition-colors hover:border-primary hover:bg-primary/5"
                      >
                        <span className="font-data text-xs font-semibold text-foreground">
                          {dest.key}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                          {codeNames[dest.code] ?? dest.code}
                        </span>
                        <span className="shrink-0 font-data text-[11px] text-primary">
                          poner acá
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* A otra persona: escribir la clave y elegir el tipo. También
                sirve para cambiarle el tipo a un archivo ya asignado, porque
                el formulario viene con lo que tiene. */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">
                {destinations.length > 0
                  ? 'O a otra persona'
                  : 'A qué expediente pertenece'}
              </Label>
              <Input
                id="assign-key"
                list={DATALIST_ID}
                inputMode="numeric"
                value={current.key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Número del beneficiario"
                aria-describedby="assign-key-help"
              />
              <datalist id={DATALIST_ID}>
                {knownKeys.map((key) => (
                  <option key={key} value={key} />
                ))}
              </datalist>
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
              <p id="assign-key-help" className="text-[11px] text-muted-foreground">
                Es el número que junta los documentos de una misma persona.
              </p>
            </div>

            {/* Vista previa del nombre resultante, solo cuando lo compone a
                mano el operador: si elige un hueco de la lista, el nombre ya
                está dicho y esto sería ruido. */}
            {changed || problem ? (
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
            ) : null}

            <div className="flex items-center gap-2 border-t border-border pt-3">
              <Button
                size="sm"
                disabled={problem !== null || !changed}
                onClick={() => onApply(sourceId, current.key, current.code)}
              >
                <CheckCircle2 className="size-4" />
                Guardar con estos datos
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto h-7 text-xs text-muted-foreground hover:bg-error-light hover:text-error"
                onClick={() => onRemove(sourceId)}
              >
                <Trash2 className="size-3.5" />
                Sacar del lote
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
