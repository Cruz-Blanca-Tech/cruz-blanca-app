'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, XCircle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRejectCase } from '../hooks/use-triaje-queries';
import {
  rejectCaseFormSchema,
  type RejectCaseFormValues,
} from '../schemas/reject-case-form-schema';

interface RejectCaseDialogProps {
  caseId: string;
  batchId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se invoca tras un rechazo exitoso (p. ej. para volver al detalle del lote). */
  onRejected?: () => void;
}

const EMPTY_FORM: RejectCaseFormValues = { reason: '' };

/**
 * Diálogo "Rechazar expediente": pide un motivo obligatorio (validado con Zod) y
 * rechaza el expediente vía `useRejectCase`. Reproduce el patrón del
 * `RejectBatchDialog`. No permite enviar sin motivo; deshabilita todo mientras la
 * mutación está en curso.
 */
export function RejectCaseDialog({
  caseId,
  batchId,
  open,
  onOpenChange,
  onRejected,
}: RejectCaseDialogProps) {
  const rejectCase = useRejectCase(caseId, batchId);

  const form = useForm<RejectCaseFormValues>({
    resolver: zodResolver(rejectCaseFormSchema),
    defaultValues: EMPTY_FORM,
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset(EMPTY_FORM);
      rejectCase.reset();
    }
    onOpenChange(next);
  };

  const onSubmit = form.handleSubmit((values) => {
    rejectCase.mutate(values.reason, {
      onSuccess: () => {
        toast.success('Expediente rechazado.');
        handleOpenChange(false);
        onRejected?.();
      },
      onError: (error) => {
        toast.error(error.message || 'No se pudo rechazar el expediente.');
      },
    });
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="flex-row items-center gap-2.5 border-b border-border p-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-error-light text-error-dark">
            <XCircle className="size-4" />
          </span>
          <div className="flex flex-col gap-0.5">
            <DialogTitle>Rechazar expediente</DialogTitle>
            <DialogDescription className="font-data text-xs">
              El expediente se marcará como rechazado y no se incluirá en la
              aprobación del lote. Podrás reabrirlo desde el detalle del lote.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col">
          <div className="flex flex-col gap-1.5 p-4">
            <Label htmlFor="reject-case-reason">
              Motivo del rechazo <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reject-case-reason"
              rows={4}
              placeholder="Explica por qué se rechaza este expediente…"
              aria-invalid={Boolean(form.formState.errors.reason)}
              disabled={rejectCase.isPending}
              {...form.register('reason')}
            />
            {form.formState.errors.reason && (
              <p className="text-xs text-destructive">
                {form.formState.errors.reason.message}
              </p>
            )}
          </div>

          <DialogFooter className="mx-0 mb-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={rejectCase.isPending}
            >
              Volver
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={rejectCase.isPending}
            >
              {rejectCase.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <XCircle />
              )}
              Rechazar expediente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
