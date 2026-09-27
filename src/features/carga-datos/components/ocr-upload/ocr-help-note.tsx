import { Lightbulb } from 'lucide-react';

/**
 * Consejo de escaneo. Va al pie de la pantalla y es informativo: el lote se
 * sube igual, solo que una foto peor se lee peor. Plegado para no sumar altura a
 * una pantalla que ya tiene dos paneles con scroll propio.
 */
export function OcrHelpNote() {
  return (
    <details className="group rounded-lg border border-border bg-muted/40">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3.5 py-2 font-data text-xs text-muted-foreground select-none hover:text-foreground">
        <Lightbulb className="size-3.5 shrink-0 text-info-dark" />
        <span className="flex-1">
          <strong className="font-medium text-foreground">
            Para que las fotos se lean bien
          </strong>
        </span>
        <span className="font-data text-[10px] group-open:hidden">
          Ver consejo
        </span>
        <span className="hidden font-data text-[10px] group-open:inline">
          Ocultar
        </span>
      </summary>
      <p className="border-t border-border px-3.5 py-2.5 font-data text-xs leading-relaxed text-muted-foreground">
        Conviene que la ficha esté bien iluminada, sin sombras y con resolución
        mínima de 200 DPI. Las fotos muy inclinadas o con texto manuscrito
        ilegible se leen peor, y eso después hay que corregirlo a mano en el
        triaje.
      </p>
    </details>
  );
}
