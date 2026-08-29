import { FileWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IncompleteCasePanelProps {
  dniReference: string;
  onUpload: () => void;
  disabled: boolean;
}

/**
 * Panel de expediente incompleto: reemplaza al formulario mientras faltan
 * documentos requeridos. La validación cruzada queda bloqueada hasta completarlo.
 */
export function IncompleteCasePanel({
  dniReference,
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
        Faltan documentos requeridos para procesar este expediente. Por favor, sube
        los documentos pendientes para continuar.
      </p>
      <Button onClick={onUpload} className="mt-2" disabled={disabled}>
        Subir documentos faltantes
      </Button>
      <p className="font-data text-[11px] text-ink-muted mt-2">
        La validación de datos cruzados está bloqueada hasta que el expediente esté
        completo.
      </p>
    </div>
  );
}
