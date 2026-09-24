'use client';

import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, Calendar, ClipboardList, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { usePrograms, useActivities } from '@/shared/hooks/use-intake-queries';

import { useCreateActivity, useDocumentCatalog } from '../hooks/use-mdm-queries';
import { ACTIVITY_TEMPLATES, findTemplateById } from '../lib/activity-templates';
import {
  createActivityFormSchema,
  type CreateActivityFormValues,
  type CreateActivityPayload,
} from '../schemas/create-activity-schema';

const EMPTY_FORM: CreateActivityFormValues = {
  name: '',
  program_id: '',
  activity_type: '',
  start_date: '',
  end_date: '',
};

/** Umbral de confianza por defecto de los documentos exigidos por la plantilla. */
const DEFAULT_REQUIREMENT_THRESHOLD = 0.8;

/** Orquestador de la pantalla MDM de Actividades (ruta /mdm/actividades). */
export function ActivitiesScreen() {
  const { data: activities = [], isLoading: isLoadingActivities } = useActivities(null);
  const programs = usePrograms();
  const catalog = useDocumentCatalog();
  const createActivity = useCreateActivity();

  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<CreateActivityFormValues>({
    resolver: zodResolver(createActivityFormSchema),
    defaultValues: EMPTY_FORM,
  });

  const programId = useWatch({ control: form.control, name: 'program_id' });
  const activityType = useWatch({ control: form.control, name: 'activity_type' });

  const selectedProgram = useMemo(
    () => (programs.data ?? []).find((program) => program.id === programId),
    [programs.data, programId]
  );

  // Plantillas cuyo programa coincide con el seleccionado (substring
  // case-insensitive). Sin programa se muestran todas para guiar al usuario.
  const availableTemplates = useMemo(
    () =>
      selectedProgram
        ? ACTIVITY_TEMPLATES.filter((template) =>
            template.programMatches.some((name) =>
              selectedProgram.name.toLowerCase().includes(name.toLowerCase())
            )
          )
        : ACTIVITY_TEMPLATES,
    [selectedProgram]
  );

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset(EMPTY_FORM);
      createActivity.reset();
    }
  };

  const onSubmit = form.handleSubmit((values) => {
    const template = findTemplateById(values.activity_type);
    if (!template) {
      toast.error('Selecciona una plantilla de trámite.');
      return;
    }

    // Mapea los códigos de documento de la plantilla a ids reales del catálogo.
    const requirements: CreateActivityPayload['requirements'] = [];
    for (const code of template.requiredDocCodes) {
      const configDoc = (catalog.data ?? []).find((doc) => doc.code === code);
      if (configDoc) {
        requirements.push({
          document_type_config_id: configDoc.id,
          is_required: true,
          confidence_threshold: DEFAULT_REQUIREMENT_THRESHOLD,
        });
      }
    }

    if (requirements.length === 0) {
      toast.error('No se encontraron documentos en el catálogo para esta plantilla.');
      return;
    }

    createActivity.mutate(
      {
        name: values.name.trim(),
        program_id: values.program_id,
        activity_type: template.id,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        requirements,
      },
      {
        onSuccess: () => {
          toast.success('Actividad creada exitosamente');
          handleOpenChange(false);
        },
        onError: (error) => {
          console.error(error);
          toast.error(error.message || 'Ocurrió un error al guardar la actividad');
        },
      }
    );
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-ink-primary flex items-center gap-2">
            <ClipboardList className="size-6 text-primary" />
            Gestión de Actividades (Períodos y Campañas)
          </h1>
          <p className="mt-1 font-sans text-sm text-ink-muted">
            Crea los períodos oficiales (ej. Educa 2026-1) para que los lotes de documentos sepan qué procesar.
          </p>
        </div>

        <Button onClick={() => handleOpenChange(true)}>
          <Plus className="mr-2 size-4" />
          Nueva Actividad
        </Button>
      </header>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nueva Actividad / Campaña</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Programa *</Label>
              <Select
                value={programId || undefined}
                onValueChange={(val) => {
                  form.setValue('program_id', val ?? '', { shouldValidate: true });
                  // Al cambiar de programa se resetea la plantilla seleccionada.
                  form.setValue('activity_type', '');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un programa" />
                </SelectTrigger>
                <SelectContent>
                  {(programs.data ?? []).map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.program_id && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.program_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tipo de Trámite (Plantilla) *</Label>
              <Select
                value={activityType || undefined}
                onValueChange={(val) =>
                  form.setValue('activity_type', val ?? '', { shouldValidate: true })
                }
                disabled={!programId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione la plantilla documental" />
                </SelectTrigger>
                <SelectContent>
                  {availableTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!programId && (
                <p className="text-xs text-muted-foreground">
                  Selecciona primero un programa para ver sus trámites.
                </p>
              )}
              {form.formState.errors.activity_type && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.activity_type.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity-name">Nombre del Período / Evento *</Label>
              <Input
                id="activity-name"
                placeholder="Ej. Educa 2026-1"
                aria-invalid={Boolean(form.formState.errors.name)}
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="activity-start">Fecha Inicio</Label>
                <Input id="activity-start" type="date" {...form.register('start_date')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activity-end">Fecha Fin</Label>
                <Input id="activity-end" type="date" {...form.register('end_date')} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createActivity.isPending}>
                {createActivity.isPending ? 'Creando...' : 'Crear Actividad'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Programa</TableHead>
              <TableHead>Nombre del Período</TableHead>
              <TableHead>Tipo de Trámite</TableHead>
              <TableHead>Vigencia</TableHead>
              <TableHead className="w-[80px]">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingActivities ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Cargando actividades...
                </TableCell>
              </TableRow>
            ) : activities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No hay actividades registradas. Crea tu primer período.
                </TableCell>
              </TableRow>
            ) : (
              activities.map((activity) => {
                const program = (programs.data ?? []).find((p) => p.id === activity.program_id);
                const template = findTemplateById(activity.activity_type);

                return (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Briefcase className="size-4" />
                        {program?.name || 'Desconocido'}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-ink-primary">
                      {activity.name}
                    </TableCell>
                    <TableCell>
                      {template?.label || activity.activity_type || 'Custom'}
                    </TableCell>
                    <TableCell>
                      {activity.start_date || activity.end_date ? (
                        <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
                          <Calendar className="size-3.5" />
                          {activity.start_date || '?'} al {activity.end_date || '?'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50 text-sm">Sin fechas</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {activity.is_active ? (
                        <Badge className="bg-success-light text-success-dark ring-1 ring-inset ring-success/20">
                          Activa
                        </Badge>
                      ) : (
                        <Badge className="bg-error-light text-error-dark ring-1 ring-inset ring-error/10">
                          Cerrada
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}