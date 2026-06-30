'use client';

import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import { usePrograms, useActivities } from '@/shared/hooks/use-intake-queries';
import { useCargaDatosStore } from '../../stores/carga-datos-store';
import { useIsAdmin } from '@/features/auth/hooks/use-permissions';
import { CreateActivityDialog } from './create-activity-dialog';
import type { Activity } from '@/shared/schemas/activity-schema';

/** Valor sentinela para la opción "crear actividad" dentro del select. */
const CREATE_ACTIVITY_VALUE = '__create_activity__';

/**
 * Flag temporal: oculta la opción de crear actividad dentro del select.
 * Se implementará más adelante; mientras tanto la lógica (sentinela, diálogo,
 * permisos) se conserva intacta detrás de este flag.
 */
const SHOW_CREATE_ACTIVITY = false;

export function ProgramActivityStep() {
  const isAdmin = useIsAdmin();

  const selectedProgramId = useCargaDatosStore((s) => s.selectedProgramId);
  const setSelectedProgramId = useCargaDatosStore((s) => s.setSelectedProgramId);
  const selectedActivityId = useCargaDatosStore((s) => s.selectedActivityId);
  const setSelectedActivityId = useCargaDatosStore(
    (s) => s.setSelectedActivityId
  );

  const [dialogOpen, setDialogOpen] = useState(false);

  const programs = usePrograms();
  const activities = useActivities(selectedProgramId, Boolean(selectedProgramId));

  // base-ui usa `items` (value → label) para que el trigger muestre el nombre
  // en vez del id crudo del valor seleccionado.
  const programItems =
    programs.data?.map((p) => ({ value: p.id, label: p.name })) ?? [];
  const activityItems =
    activities.data?.map((a) => ({ value: a.id, label: a.name })) ?? [];

  const handleProgramChange = (programId: string | null) => {
    setSelectedProgramId(programId);
    // Al cambiar de programa, la actividad seleccionada deja de ser válida.
    setSelectedActivityId(null);
  };

  const handleActivityChange = (value: string | null) => {
    // La opción sentinela abre el modal sin alterar la selección actual.
    if (value === CREATE_ACTIVITY_VALUE) {
      setDialogOpen(true);
      return;
    }
    setSelectedActivityId(value);
  };

  const handleActivityCreated = (activity: Activity) => {
    // La lista se refresca por invalidación de la query; seleccionamos la nueva.
    setSelectedActivityId(activity.id);
  };

  const hasProgram = Boolean(selectedProgramId);
  const noActivities =
    hasProgram && !activities.isLoading && activities.data?.length === 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Programa */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="program-select">
          Programa <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedProgramId}
          onValueChange={handleProgramChange}
          items={programItems}
          disabled={programs.isLoading || programs.isError}
        >
          <SelectTrigger id="program-select" className="h-10 w-full">
            <SelectValue
              placeholder={
                programs.isLoading
                  ? 'Cargando programas…'
                  : 'Selecciona un programa'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {programs.data?.map((program) => (
              <SelectItem key={program.id} value={program.id}>
                {program.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {programs.isError && (
          <p className="text-xs text-destructive">
            No se pudieron cargar los programas.
          </p>
        )}
      </div>

      {/* Actividad */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="activity-select">
          Tipo de actividad <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedActivityId}
          onValueChange={handleActivityChange}
          items={activityItems}
          disabled={!hasProgram || activities.isLoading}
        >
          <SelectTrigger id="activity-select" className="h-10 w-full">
            <SelectValue
              placeholder={
                !hasProgram
                  ? 'Primero elige un programa'
                  : activities.isLoading
                    ? 'Cargando actividades…'
                    : 'Selecciona una actividad'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {activities.data?.map((activity) => (
              <SelectItem key={activity.id} value={activity.id}>
                {activity.name}
              </SelectItem>
            ))}
            {SHOW_CREATE_ACTIVITY && isAdmin && (
              <>
                {(activities.data?.length ?? 0) > 0 && <SelectSeparator />}
                <SelectItem value={CREATE_ACTIVITY_VALUE} className="text-primary">
                  <Plus className="text-primary" />
                  Crear actividad nueva…
                </SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
        {activities.isError && (
          <p className="text-xs text-destructive">
            No se pudieron cargar las actividades.
          </p>
        )}
        {noActivities && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {activities.isFetching && <Loader2 className="size-3 animate-spin" />}
            No hay actividades para este programa.
            {SHOW_CREATE_ACTIVITY && isAdmin && ' Crea una nueva desde el menú.'}
          </p>
        )}
      </div>

      <CreateActivityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={handleActivityCreated}
      />
    </div>
  );
}
