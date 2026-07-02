import { EyeOff } from 'lucide-react';

/**
 * Aviso que se muestra cuando el usuario autenticado tiene rol Visualizador: los
 * datos personales (nombre y DNI) se muestran enmascarados. Reemplaza al toggle
 * manual del mockup, que aquí es automático según el rol.
 *
 * Usa los tokens `program-familia*` (el morado del design system) para el mismo
 * tratamiento visual del banner del mockup, sin hex.
 */
export function VisualizadorBanner() {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-program-familia/20 bg-program-familia-light px-3.5 py-2.5">
      <EyeOff className="mt-0.5 size-3.5 shrink-0 text-program-familia-dark" />
      <div>
        <p className="font-sans text-sm font-medium text-program-familia-dark">
          Vista del Visualizador
        </p>
        <p className="mt-0.5 font-data text-xs text-ink-secondary">
          El nombre se muestra abreviado y el DNI solo expone los últimos cuatro
          dígitos por protección de datos personales.
        </p>
      </div>
    </div>
  );
}
