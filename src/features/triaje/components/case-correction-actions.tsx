import { ArrowLeft, ArrowRight, Loader2, Save, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CaseCorrectionActionsProps {
  onBack: () => void;
  onReject: () => void;
  onSubmit: () => void;
  onNext: () => void;
  hasNext: boolean;
  isSubmitting: boolean;
  isIncomplete: boolean;
  canReject: boolean;
  canEdit: boolean;
}

/** Barra de acciones del expediente: volver, rechazar, siguiente y guardar. */
export function CaseCorrectionActions({
  onBack,
  onReject,
  onSubmit,
  onNext,
  hasNext,
  isSubmitting,
  isIncomplete,
  canReject,
  canEdit,
}: CaseCorrectionActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 font-sans text-sm text-ink-secondary hover:text-ink-primary"
      >
        <ArrowLeft className="size-3.5" />
        Volver al lote
      </button>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          className="border-error text-error-dark hover:bg-error-light"
          onClick={onReject}
          disabled={isSubmitting || isIncomplete || !canReject}
        >
          <XCircle />
          Rechazar expediente
        </Button>
        {hasNext && (
          <Button variant="outline" onClick={onNext}>
            Siguiente registro
            <ArrowRight />
          </Button>
        )}
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || isIncomplete || !canEdit}
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
          Guardar correcciones
        </Button>
      </div>
    </div>
  );
}
