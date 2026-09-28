'use client';

import { useState } from 'react';
import { FileText, RotateCcw, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface StartOverButtonProps {
  /** Archivos del lote en curso, para decir cuántos se pierden. */
  fileCount: number;
  programLabel: string | null;
  activityName: string | null;
  /** Borra solo los archivos y deja programa y actividad. */
  onClearFiles: () => void;
  /** Borra archivos, programa y actividad. */
  onResetAll: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * "Empezar de cero": la salida para dejar de trabajar un lote.
 *
 * El store de carga persiste programa, actividad y archivos a propósito, para
 * que un refresh a mitad de un lote de 200 archivos no tire media hora de
 * agrupamiento. El otro lado de esa decisión es que no había forma de
 * *dejar* el lote: `reset()` existía, pero solo lo disparaba el botón "subir
 * más" del paso procesando, o sea después de mandar el lote. Mientras se está
 * armando no había salida, y como el paso activo no se persiste, un refresh
 * deja al operador en el paso 1 con 181 archivos esperando que los descubra
 * recién al tocar "Continuar".
 *
 * El botón no aparece si no hay nada que borrar: en un flujo normal, del
 * principio al final, no hay nada que limpiar y el botón sería ruido.
 *
 * Pide confirmación siempre, y son **dos** acciones distintas porque "cargar
 * de cero" y "misma actividad, otro lote de archivos" son dos necesidades
 * reales: con la segunda, volver a elegir el programa y la actividad es
 * trabajo de verdad. Lo que se pierde no es el archivo —ese sigue en Drive— sino
 * el agrupamiento por expediente, y por eso el diálogo lo dice.
 */
export function StartOverButton({
  fileCount,
  programLabel,
  activityName,
  onClearFiles,
  onResetAll,
  disabled = false,
  className,
}: StartOverButtonProps) {
  const [open, setOpen] = useState(false);

  const hasFiles = fileCount > 0;
  const hasTarget = Boolean(programLabel || activityName);

  if (!hasFiles && !hasTarget) return null;

  const destino =
    programLabel && activityName
      ? `${programLabel} · ${activityName}`
      : (programLabel ?? activityName);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          'h-7 text-xs font-medium text-muted-foreground hover:text-error',
          className
        )}
      >
        <RotateCcw className="size-3.5" />
        Empezar de cero
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Empezar de cero</DialogTitle>
            <DialogDescription className="text-xs">
              {hasFiles
                ? `Perdés los ${fileCount} archivos del lote${
                    destino ? ` de ${destino}` : ''
                  } y todo el agrupamiento por expediente. Los archivos siguen en Drive; lo que no se recupera son los nombres que les corregiste.`
                : `Perdés el programa y la actividad${destino ? ` (${destino})` : ''}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            {hasFiles && (
              <button
                type="button"
                onClick={() => run(onClearFiles)}
                className="flex items-start gap-3 rounded-md border border-border p-3 text-left transition-colors hover:border-primary hover:bg-primary/5 focus-visible:border-primary focus-visible:outline-none"
              >
                <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">
                    Borrar solo los archivos
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Deja el programa y la actividad. Quedan 0 archivos, listo
                    para traer otro lote de Drive.
                  </span>
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => run(onResetAll)}
              className="flex items-start gap-3 rounded-md border border-border p-3 text-left transition-colors hover:border-error hover:bg-error/5 focus-visible:border-error focus-visible:outline-none"
            >
              <Trash2 className="mt-0.5 size-4 shrink-0 text-error" />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">
                  Borrar todo y arrancar de cero
                </span>
                <span className="block text-xs text-muted-foreground">
                  Archivos, programa y actividad. Vuelve al paso 1 en blanco.
                </span>
              </span>
            </button>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
