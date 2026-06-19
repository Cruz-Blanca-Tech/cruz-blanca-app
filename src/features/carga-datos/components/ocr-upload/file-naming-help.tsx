import { FileCog, Info } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { ExpectedDocument } from '../../types';

interface FileNamingHelpProps {
  /** Documentos de la actividad seleccionada; definen los sufijos relevantes. */
  documents: ExpectedDocument[];
}

const DNI_DEMO = '78076548';

/** Normaliza un código a sufijo con guion bajo inicial (p. ej. `DNI_N` → `_DNI_N`). */
function toSuffix(code: string): string {
  return code.startsWith('_') ? code : `_${code}`;
}

export function FileNamingHelp({ documents }: FileNamingHelpProps) {
  // Sufijos únicos por código (varios documentos pueden compartir sufijo).
  const suffixes = Array.from(
    new Map(documents.map((doc) => [doc.code, doc])).values()
  );

  const exampleSuffix = suffixes.length > 0 ? toSuffix(suffixes[0].code) : '_DNI_N';

  return (
    <section className="rounded-lg border border-border bg-slate-50 p-4.5">
      <header className="mb-2.5 flex items-center gap-2">
        <span className="flex size-6.5 items-center justify-center rounded-md bg-secondary text-primary">
          <FileCog className="size-3.5" />
        </span>
        <h3 className="font-heading text-sm font-medium text-foreground">
          Convención de nombres de archivo
        </h3>
        <span className="flex-1" />
        <span className="font-data text-[10px] tracking-wide text-muted-foreground uppercase">
          Enrutamiento automático
        </span>
      </header>

      <p className="mb-3 font-data text-xs leading-relaxed text-ink-secondary">
        El backend enruta cada archivo según su nombre. Usa la sintaxis:
      </p>

      <div className="mb-3.5 flex flex-wrap items-center gap-2 rounded-md border border-border bg-card px-3 py-2.5">
        <code className="font-data text-sm font-medium">
          <span className="text-program-familia">[DNI_BENEFICIARIO]</span>
          <span className="text-muted-foreground">_</span>
          <span className="text-warning-dark">[SUFIJO]</span>
          <span className="text-muted-foreground">.</span>
          <span className="text-success-dark">[EXT]</span>
        </code>
        <span className="font-data text-xs text-muted-foreground">→ ejemplo:</span>
        <code className="rounded-sm bg-secondary px-2 py-0.5 font-data text-sm font-medium text-brand-dark">
          {DNI_DEMO}
          {exampleSuffix}.pdf
        </code>
      </div>

      {suffixes.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-border">
          <div className="grid grid-cols-[88px_1fr] gap-3 bg-slate-100 px-3 py-2 font-data text-[10px] font-semibold tracking-wider text-ink-secondary uppercase sm:grid-cols-[120px_1fr]">
            <span>Sufijo</span>
            <span>Documento</span>
          </div>
          {suffixes.map((doc, index) => (
            <div
              key={doc.code}
              className="grid grid-cols-[88px_1fr] items-center gap-3 bg-card px-3 py-2 sm:grid-cols-[120px_1fr]"
              style={index > 0 ? { borderTop: '1px solid var(--border)' } : undefined}
            >
              <code
                title={toSuffix(doc.code)}
                className="w-fit max-w-full rounded-sm bg-warning-light px-1.5 py-0.5 font-data text-xs font-semibold break-all text-warning-dark"
              >
                {toSuffix(doc.code)}
              </code>
              <span className="flex items-center gap-1.5 text-sm text-foreground">
                {doc.name}
                <Badge
                  variant="outline"
                  className="border-success/40 text-success-dark"
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  requerido
                </Badge>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-border bg-card px-3 py-2.5 font-data text-xs text-muted-foreground">
          Selecciona una actividad para ver los sufijos de archivo requeridos.
        </p>
      )}

      <p className="mt-3 flex items-start gap-2 font-data text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <span>
          El <strong className="font-medium">DNI</strong> agrupa todos los
          archivos de un mismo beneficiario en un expediente. El{' '}
          <strong className="font-medium">sufijo</strong> determina qué modelo de
          IA se invoca para extraer los datos.
        </span>
      </p>
    </section>
  );
}
