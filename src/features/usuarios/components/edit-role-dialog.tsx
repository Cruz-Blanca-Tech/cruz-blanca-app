'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Check, Loader2 } from 'lucide-react';

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

import { useUpdateUserRole } from '../hooks/use-usuarios-queries';
import { ROLE_LIST } from '../lib/role-config';
import {
  updateRoleFormSchema,
  type UpdateRoleFormValues,
  type User,
} from '../schemas/user-schema';
import { UserAvatar } from './user-avatar';

interface EditRoleDialogProps {
  /** Usuario cuyo rol se edita. El diálogo se monta solo cuando hay uno. */
  user: User;
  /** Se invoca al cerrar (éxito o cancelación) para desmontar el diálogo. */
  onClose: () => void;
}

/**
 * Diálogo "Editar rol": muestra el usuario en modo lectura (avatar + nombre +
 * email) y un selector con los 4 roles. Al enviar, llama `useUpdateUserRole`
 * (PATCH /auth/users/{id}/role); en éxito muestra un toast y cierra, en error
 * muestra el mensaje. El submit queda deshabilitado mientras la mutación corre.
 */
export function EditRoleDialog({ user, onClose }: EditRoleDialogProps) {
  const updateRole = useUpdateUserRole();

  const form = useForm<UpdateRoleFormValues>({
    resolver: zodResolver(updateRoleFormSchema),
    defaultValues: { role: user.role },
  });

  const handleOpenChange = (next: boolean) => {
    // No se cierra a mitad del guardado (backdrop/Esc): sería inconsistente con
    // el botón Cancelar, que sí queda deshabilitado mientras la mutación corre.
    if (!next && !updateRole.isPending) onClose();
  };

  const onSubmit = form.handleSubmit((values) => {
    updateRole.mutate(
      { userId: user.id, role: values.role },
      {
        onSuccess: (updated) => {
          toast.success(`Rol de ${updated.full_name} actualizado.`);
          onClose();
        },
        onError: (error) => {
          toast.error(error.message || 'No se pudo actualizar el rol.');
        },
      }
    );
  });

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="gap-0.5 border-b border-border p-4">
          <DialogTitle>Editar rol</DialogTitle>
          <DialogDescription className="font-data text-xs">
            Cambia el nivel de acceso del usuario en el sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col">
          <div className="flex flex-col gap-4 p-4">
            {/* Usuario en modo lectura */}
            <div className="flex items-center gap-3 rounded-lg border border-border bg-slate-50 p-3">
              <UserAvatar fullName={user.full_name} role={user.role} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-sans text-sm font-medium text-ink-primary">
                  {user.full_name}
                </p>
                <p className="truncate font-data text-xs text-ink-muted">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Selector de rol */}
            <div className="flex flex-col gap-1.5">
              <Label>Rol</Label>
              <Controller
                control={form.control}
                name="role"
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={updateRole.isPending}
                    className="gap-2"
                  >
                    {ROLE_LIST.map((config) => {
                      const active = field.value === config.role;
                      return (
                        <Label
                          key={config.role}
                          className={cn(
                            'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors',
                            active
                              ? 'border-primary bg-brand-50'
                              : 'border-border hover:bg-slate-50'
                          )}
                        >
                          <RadioGroupItem
                            value={config.role}
                            className="mt-0.5"
                          />
                          <span className="flex flex-col gap-0.5">
                            <span className="font-sans text-sm font-medium text-ink-primary">
                              {config.label}
                            </span>
                            <span className="font-data text-xs text-ink-muted">
                              {config.description}
                            </span>
                          </span>
                        </Label>
                      );
                    })}
                  </RadioGroup>
                )}
              />
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateRole.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateRole.isPending}>
              {updateRole.isPending ? <Loader2 className="animate-spin" /> : <Check />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
