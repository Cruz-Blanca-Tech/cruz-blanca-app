import { FileCog, Info } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { ExpectedDocument } from '../../types';

interface FileNamingHelpProps {
  /** Documentos de la actividad seleccionada; definen los sufijos relevantes. */
  documents: ExpectedDocument[];
}

const KEY_DEMO = '78076548';

interface FileNamingHelpProps {
  /** Documentos de la actividad seleccionada; definen los sufijos relevantes. */
  documents: ExpectedDocument[];
}

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
          Cómo se nombran los archivos
        </h3>
      </header>

      <p className="mb-3 font-data text-xs leading-relaxed text-ink-secondary">
        Cada archivo se ubica solo por su nombre. El formato es:
      </p>

      <div className="mb-3.5 flex flex-wrap items-center gap-2 rounded-md border border-border bg-card px-3 py-2.5">
        <code className="font-data text-sm font-medium">
          <span className="text-program-familia">[NÚMERO]</span>
          <span className="text-muted-foreground">_</span>
          <span className="text-warning-dark">[TIPO]</span>
          <span className="text-muted-foreground">.</span>
          <span className="text-success-dark">[FORMATO]</span>
        </code>
        <span className="font-data text-xs text-muted-foreground">
          por ejemplo:
        </span>
        <code className="rounded-sm bg-secondary px-2 py-0.5 font-data text-sm font-medium text-brand-dark">
          {KEY_DEMO}
          {exampleSuffix}.pdf
        </code>
      </div>

      {suffixes.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-border">
          <div className="grid grid-cols-[88px_1fr] gap-3 bg-slate-100 px-3 py-2 font-data text-[10px] font-semibold tracking-wider text-ink-secondary uppercase sm:grid-cols-[120px_1fr]">
            <span>Tipo</span>
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
                {doc.isRequired === false ? (
                  <Badge
                    variant="outline"
                    className="border-border text-muted-foreground"
                  >
                    opcional
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-success/40 text-success-dark"
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    requerido
                  </Badge>
                )}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-border bg-card px-3 py-2.5 font-data text-xs text-muted-foreground">
          Selecciona una actividad para ver los tipos de archivo requeridos.
        </p>
      )}

      <p className="mt-3 flex items-start gap-2 font-data text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <span>
          El <strong className="font-medium">número</strong> es lo que junta
          todos los archivos de una misma persona en un expediente, y el{' '}
          <strong className="font-medium">tipo</strong> dice qué documento es
          cada uno. No hace falta que el número tenga 8 dígitos: si no los tiene,
          los archivos se agrupan igual y en el triaje va a figurar como
          «identificador», no como DNI.
        </span>
      </p>
    </section>
  );
}
