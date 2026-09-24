'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Edit2, MapPin, Phone, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useSaveSchool, useSchools } from '../hooks/use-mdm-queries';
import {
  schoolFormSchema,
  type School,
  type SchoolFormValues,
} from '../schemas/school-schema';

const EMPTY_FORM: SchoolFormValues = { name: '', location: '', phone: '' };

/** Orquestador de la pantalla MDM de Colegios (ruta /mdm/colegios). */
export function SchoolsScreen() {
  const { data: schools = [], isLoading } = useSchools();
  const saveSchool = useSaveSchool();

  const [isOpen, setIsOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);

  const form = useForm<SchoolFormValues>({
    resolver: zodResolver(schoolFormSchema),
    defaultValues: EMPTY_FORM,
  });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingSchool(null);
      form.reset(EMPTY_FORM);
    }
  };

  const openCreate = () => {
    setEditingSchool(null);
    form.reset(EMPTY_FORM);
    setIsOpen(true);
  };

  const openEdit = (school: School) => {
    setEditingSchool(school);
    form.reset({
      name: school.name,
      location: school.location ?? '',
      phone: school.phone ?? '',
    });
    setIsOpen(true);
  };

  const onSubmit = form.handleSubmit((values) => {
    saveSchool.mutate(
      { id: editingSchool?.id, payload: values },
      {
        onSuccess: () => {
          toast.success(editingSchool ? 'Colegio actualizado' : 'Colegio creado');
          handleOpenChange(false);
        },
        onError: (error) => {
          toast.error(error.message || 'Ocurrió un error al guardar el colegio');
        },
      }
    );
  });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-ink-primary flex items-center gap-2">
            <Building2 className="size-6 text-brand" />
            Gestión de Colegios (MDM)
          </h1>
          <p className="mt-1 font-sans text-sm text-ink-muted">
            Administra el maestro de colegios para mantener la base de datos unificada.
          </p>
        </div>

        <Button onClick={openCreate}>
          <Plus className="mr-2 size-4" />
          Nuevo Colegio
        </Button>
      </header>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSchool ? 'Editar Colegio' : 'Crear Nuevo Colegio'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="school-name">Nombre del Colegio *</Label>
              <Input
                id="school-name"
                placeholder="Ej. I.E. San José"
                aria-invalid={Boolean(form.formState.errors.name)}
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="school-location">Dirección / Ubicación</Label>
              <Input
                id="school-location"
                placeholder="Ej. Av. Principal 123"
                {...form.register('location')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="school-phone">Teléfono de contacto</Label>
              <Input
                id="school-phone"
                placeholder="Ej. 01 555-1234"
                {...form.register('phone')}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saveSchool.isPending}>
                {saveSchool.isPending ? 'Guardando...' : 'Guardar Colegio'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Nombre del Colegio</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="w-[100px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Cargando colegios...
                </TableCell>
              </TableRow>
            ) : schools.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No hay colegios registrados.
                </TableCell>
              </TableRow>
            ) : (
              schools.map((school) => (
                <TableRow key={school.id}>
                  <TableCell className="font-medium text-ink-primary">
                    {school.name}
                  </TableCell>
                  <TableCell>
                    {school.location ? (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="size-3.5" /> {school.location}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {school.phone ? (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="size-3.5" /> {school.phone}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(school)}
                      aria-label={`Editar ${school.name}`}
                    >
                      <Edit2 className="size-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}