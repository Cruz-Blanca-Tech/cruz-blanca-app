import { ArrowLeft, OctagonAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CaseNotFoundProps {
  onBack: () => void;
}

/** Estado de error / expediente inexistente de la pantalla de corrección. */
export function CaseNotFound({ onBack }: CaseNotFoundProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <OctagonAlert className="size-9 text-error" />
      <h1 className="font-heading text-2xl font-bold text-ink-primary">
        Expediente no encontrado
      </h1>
      <p className="max-w-md font-data text-sm text-ink-muted">
        No se pudo cargar el expediente solicitado. Puede que ya no exista o que
        haya un problema de conexión.
      </p>
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft />
        Volver al lote
      </Button>
    </div>
  );
}
