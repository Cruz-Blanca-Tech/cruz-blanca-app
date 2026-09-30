import { Loader2, XCircle, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CaseCorrectionActionsProps {
  onReject: () => void;
  onSubmit: () => void;
  onReprocess: () => void;
  isSubmitting: boolean;
  isIncomplete: boolean;
  canReject: boolean;
  canEdit: boolean;
  /** Reprocesar con IA reevalúa el expediente: si ya está decidido, no. */
  canReprocess: boolean;
  isReprocessing?: boolean;
}

/** Barra de acciones del expediente: Reprocesar (IA) | Rechazar | Validar. */
export function CaseCorrectionActions({
  onReject,
  onSubmit,
  onReprocess,
  isSubmitting,
  isIncomplete,
  canReject,
  canEdit,
  canReprocess,
  isReprocessing,
}: CaseCorrectionActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        className="h-8 border-primary/20 text-primary hover:bg-brand-50"
        onClick={onReprocess}
        disabled={isSubmitting || isReprocessing || !canReprocess}
        title={
          canReprocess
            ? undefined
            : 'El expediente ya tiene una decisión tomada, no se puede volver a evaluar.'
        }
      >
        {isReprocessing ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 size-3.5" />}
        Reprocesar Expediente (IA)
      </Button>

      <Button
        variant="outline"
        className="border-error text-error-dark hover:bg-error-light"
        onClick={onReject}
        disabled={isSubmitting || isIncomplete || !canReject}
      >
        <XCircle />
        Rechazar expediente
      </Button>

      <Button
        onClick={onSubmit}
        disabled={isSubmitting || isIncomplete || !canEdit}
        className="bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        {isSubmitting ? <Loader2 className="animate-spin" /> : <Check />}
        Validar correcciones
      </Button>
    </div>
  );
}