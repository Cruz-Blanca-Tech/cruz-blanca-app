'use client';

import { useQuery } from '@tanstack/react-query';
import { programsService } from '@/shared/services/programs-service';
import { activitiesService } from '@/shared/services/activities-service';

/**
 * Query keys del dominio de intake compartido (programs + activities de lectura).
 * Se exportan para que los features que ESCRIBEN sobre estas entidades (p. ej.
 * `useCreateActivity` en carga-datos) puedan invalidar la lista correspondiente.
 */
export const intakeKeys = {
  all: ['intake'] as const,
  programs: ['intake', 'programs'] as const,
  activities: (programId: string | null) =>
    ['intake', 'activities', programId] as const,
};

const FIVE_MINUTES = 1000 * 60 * 5;

/** GET /programs/ con cache. */
export function usePrograms() {
  return useQuery({
    queryKey: intakeKeys.programs,
    queryFn: programsService.getPrograms,
    staleTime: FIVE_MINUTES,
  });
}

/** GET /activities/?program_id= con cache. */
export function useActivities(programId: string | null, enabled = true) {
  return useQuery({
    queryKey: intakeKeys.activities(programId),
    queryFn: () => activitiesService.getActivities(programId),
    staleTime: FIVE_MINUTES,
    enabled,
  });
}
