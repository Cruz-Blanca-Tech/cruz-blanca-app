import { ArrowLeft, ArrowRight, Loader2, Save, XCircle, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CaseCorrectionActionsProps {
  onBack: () => void;
  onReject: () => void;
  onSubmit: () => void;
  onNext: () => void;
  onReprocess: () => void;
  hasNext: boolean;
  isSubmitting: boolean;
  isIncomplete: boolean;
  canReject: boolean;
  canEdit: boolean;
  isReprocessing?: boolean;
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
  onReprocess,
  isReprocessing,
}: CaseCorrectionActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 font-sans text-sm text-ink-secondary hover:text-ink-primary"
      >
        <ArrowLeft className="size-3.5" />
        Volver al lote
      </button>

      <Button
        variant="outline"
        size="sm"
        className="h-8 border-primary/20 text-primary hover:bg-brand-50"
        onClick={onReprocess}
        disabled={isSubmitting || isReprocessing}
      >
        {isReprocessing ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 size-3.5" />}
        Reprocesar Expediente (IA)
      </Button>
    </div>
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
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Check />}
          Validar correcciones
        </Button>
      </div>
    </div>
  );
}
