'use client';

import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import { usePrograms, useActivities } from '@/shared/hooks/use-intake-queries';
import { useIsMounted } from '@/shared/hooks/use-is-mounted';
import { useCargaDatosStore } from '../../stores/carga-datos-store';

export function ProgramActivityStep() {
  const isMounted = useIsMounted();

  const selectedProgramId = useCargaDatosStore((s) => s.selectedProgramId);
  const setSelectedProgramId = useCargaDatosStore((s) => s.setSelectedProgramId);

  const selectedActivityId = useCargaDatosStore((s) => s.selectedActivityId);
  const setSelectedActivityId = useCargaDatosStore((s) => s.setSelectedActivityId);
  
  const programsQuery = usePrograms();
  const activitiesQuery = useActivities(selectedProgramId, Boolean(selectedProgramId));

  const handleProgramChange = (programId: string | null) => {
    setSelectedProgramId(programId);
    setSelectedActivityId(null); // Reset activity when program changes
  };

  const handleActivityChange = (activityId: string | null) => {
    setSelectedActivityId(activityId);
  };

  // Find labels to avoid SelectValue showing the raw UUID
  const currentProgramLabel = useMemo(() => {
    if (!selectedProgramId || !programsQuery.data) return undefined;
    const p = programsQuery.data.find(p => p.id === selectedProgramId);
    return p ? p.name : undefined;
  }, [selectedProgramId, programsQuery.data]);

  const currentActivityLabel = useMemo(() => {
    if (!selectedActivityId || !activitiesQuery.data) return undefined;
    const a = activitiesQuery.data.find(a => a.id === selectedActivityId);
    return a ? a.name : undefined;
  }, [selectedActivityId, activitiesQuery.data]);

  const programs = programsQuery.data || [];
  const activities = activitiesQuery.data || [];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="program-select">
          Programa <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedProgramId || ''}
          onValueChange={handleProgramChange}
          disabled={isMounted ? programsQuery.isLoading : false}
        >
          <SelectTrigger id="program-select" className="h-10 w-full">
            <SelectValue
              placeholder={
                isMounted && programsQuery.isLoading
                  ? 'Cargando programas...'
                  : 'Selecciona un programa'
              }
            >
              {currentProgramLabel}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {programs.map((program) => (
              <SelectItem key={program.id} value={program.id}>
                {program.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {programsQuery.isError && (
          <p className="text-xs text-destructive">
            Error al cargar programas.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="activity-select">
          Actividad (Periodo) <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedActivityId || ''}
          onValueChange={handleActivityChange}
          disabled={isMounted ? (!selectedProgramId || activitiesQuery.isLoading) : false}
        >
          <SelectTrigger id="activity-select" className="h-10 w-full">
            <SelectValue
              placeholder={
                !selectedProgramId
                  ? 'Selecciona primero un programa'
                  : isMounted && activitiesQuery.isLoading
                  ? 'Cargando actividades...'
                  : 'Selecciona la actividad'
              }
            >
              {currentActivityLabel}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {activities.map((activity) => (
              <SelectItem key={activity.id} value={activity.id}>
                {activity.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {activitiesQuery.isError && (
          <p className="text-xs text-destructive">
            Error al cargar actividades.
          </p>
        )}
      </div>
    </div>
  );
}
