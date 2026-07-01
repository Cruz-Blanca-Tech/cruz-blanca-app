'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Ban, Loader2 } from 'lucide-react';

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
import { useRejectBatch } from '../hooks/use-triaje-queries';
import {
  rejectBatchFormSchema,
  type RejectBatchFormValues,
} from '../schemas/reject-batch-form-schema';

interface RejectBatchDialogProps {
  batchId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se invoca tras un rechazo exitoso (p. ej. para volver a la bandeja). */
  onRejected?: () => void;
}

const EMPTY_FORM: RejectBatchFormValues = { reason: '' };

/**
 * Diálogo de "Cancelar lote": pide un motivo obligatorio (validado con Zod) y
 * rechaza en masa los expedientes pendientes vía `useRejectBatch`. No permite
 * enviar sin motivo; deshabilita todo mientras la mutación está en curso.
 */
export function RejectBatchDialog({
  batchId,
  open,
  onOpenChange,
  onRejected,
}: RejectBatchDialogProps) {
  const rejectBatch = useRejectBatch(batchId);

  const form = useForm<RejectBatchFormValues>({
    resolver: zodResolver(rejectBatchFormSchema),
    defaultValues: EMPTY_FORM,
  });

  // Al cerrar se limpia el formulario y el estado de la mutación (en el handler,
  // no en un efecto: evita bucles por la identidad inestable de la mutación).
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset(EMPTY_FORM);
      rejectBatch.reset();
    }
    onOpenChange(next);
  };

  const onSubmit = form.handleSubmit((values) => {
    rejectBatch.mutate(values.reason, {
      onSuccess: (result) => {
        toast.success(
          `Lote rechazado: ${result.rejected_count} expediente(s) descartado(s).`
        );
        handleOpenChange(false);
        onRejected?.();
      },
      onError: (error) => {
        toast.error(error.message || 'No se pudo rechazar el lote.');
      },
    });
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="flex-row items-center gap-2.5 border-b border-border p-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-error-light text-error-dark">
            <Ban className="size-4" />
          </span>
          <div className="flex flex-col gap-0.5">
            <DialogTitle>Cancelar lote</DialogTitle>
            <DialogDescription className="font-data text-xs">
              Se rechazarán en masa los expedientes pendientes del lote. Esta
              acción no se puede deshacer.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col">
          <div className="flex flex-col gap-1.5 p-4">
            <Label htmlFor="reject-reason">
              Motivo del rechazo <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reject-reason"
              rows={4}
              placeholder="Explica por qué se rechaza este lote…"
              aria-invalid={Boolean(form.formState.errors.reason)}
              disabled={rejectBatch.isPending}
              {...form.register('reason')}
            />
            {form.formState.errors.reason && (
              <p className="text-xs text-destructive">
                {form.formState.errors.reason.message}
              </p>
            )}
          </div>

          {/* El DialogFooter trae `-mx-4 -mb-4` pensado para un content con `p-4`;
              como aquí el content es `p-0`, se neutralizan para que no sobresalga. */}
          <DialogFooter className="mx-0 mb-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={rejectBatch.isPending}
            >
              Volver
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={rejectBatch.isPending}
            >
              {rejectBatch.isPending ? <Loader2 className="animate-spin" /> : <Ban />}
              Rechazar lote
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
