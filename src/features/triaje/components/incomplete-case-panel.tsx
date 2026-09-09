import { FileWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PendingDocumentItem } from '../schemas/case-documents-schema';

interface IncompleteCasePanelProps {
  dniReference: string;
  pendingDocuments?: PendingDocumentItem[];
  onUpload: () => void;
  disabled: boolean;
}

/**
 * Panel de expediente incompleto: reemplaza al formulario mientras faltan
 * documentos requeridos. La validación cruzada queda bloqueada hasta completarlo.
 */
export function IncompleteCasePanel({
  dniReference,
  pendingDocuments = [],
  onUpload,
  disabled,
}: IncompleteCasePanelProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center px-6">
      <FileWarning className="size-10 text-error/80" />
      <h3 className="font-heading text-lg font-semibold text-ink-primary">
        Expediente Incompleto (DNI: {dniReference})
      </h3>
      <p className="font-sans text-sm text-ink-secondary max-w-md">
        Faltan documentos obligatorios para procesar este expediente. Por favor, sube
        los documentos pendientes para continuar.
      </p>

      {pendingDocuments.length > 0 && (
        <div className="flex flex-col items-center gap-1.5 my-1">
          <p className="font-data text-xs font-medium text-ink-secondary">
            Documentos faltantes:
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {pendingDocuments.map((doc) => (
              <span
                key={doc.code}
                className="inline-flex items-center rounded-md bg-error-light px-2.5 py-1 text-xs font-semibold text-error-dark border border-error/30 shadow-2xs"
              >
                {doc.name ? `${doc.name} (${doc.code})` : doc.code}
              </span>
            ))}
          </div>
        </div>
      )}

      <Button onClick={onUpload} className="mt-2 gap-2" disabled={disabled}>
        Subir documentos faltantes
      </Button>
      <p className="font-data text-[11px] text-ink-muted mt-2">
        La validación y aprobación de datos están bloqueadas hasta que el expediente esté
        completo con todos sus documentos.
      </p>
    </div>
  );
}
