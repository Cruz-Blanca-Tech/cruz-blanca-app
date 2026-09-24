'use client';

import { useQuery } from '@tanstack/react-query';

import { isValidDni } from '@/lib/domain/beneficiary-rules';
import { caseCorrectionService } from '../services/case-correction-service';

/** Query keys del lookup MDM por DNI (hoja propia, no colisiona con las de `triajeKeys`). */
export const mdmMatchKeys = {
  all: ['triaje', 'mdm-match'] as const,
  byDni: (dni: string) => [...mdmMatchKeys.all, dni] as const,
};

/**
 * ¿El DNI del expediente ya existe en el dato máster (MDM)?
 *
 * La query SOLO se dispara con un DNI válido de 8 dígitos (el `enabled` actúa de
 * gate; el componente debouncea antes de llamar este hook). Cuando `exists=true`,
 * la pantalla rellena/bloquea los campos protegidos con los valores del maestro.
 */
export function useMdmBeneficiaryMatch(dni: string) {
  return useQuery({
    queryKey: mdmMatchKeys.byDni(dni),
    queryFn: () => caseCorrectionService.getMdmBeneficiaryMatch(dni),
    enabled: isValidDni(dni),
    staleTime: 5 * 60 * 1000,
  });
}