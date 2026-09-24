'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { documentCatalogService } from '@/shared/services/document-catalog-service';

import { mdmService } from '../services/mdm-service';
import type { SchoolFormValues } from '../schemas/school-schema';
import type { CreateActivityPayload } from '../schemas/create-activity-schema';

/**
 * Query keys del feature `mdm`. La data de API es estado de servidor → vive en
 * TanStack Query. Se expone `schools()` como prefijo para que las mutaciones
 * invaliden el listado tras crear/editar un colegio (lo consumen tanto la tabla
 * de `mdm/colegios` como el `SchoolSelect` de beneficiarios).
 */
export const mdmKeys = {
  all: ['mdm'] as const,
  schools: ['mdm', 'schools'] as const,
  documentCatalog: ['mdm', 'document-catalog'] as const,
};

const FIVE_MINUTES = 1000 * 60 * 5;

/** GET /api/v1/mdm/schools — listado completo de colegios con cache. */
export function useSchools() {
  return useQuery({
    queryKey: mdmKeys.schools,
    queryFn: mdmService.getSchools,
    staleTime: FIVE_MINUTES,
  });
}

/**
 * POST/PATCH /api/v1/mdm/schools — crea (`id` undefined) o actualiza un colegio.
 * Al tener éxito invalida el listado para que la tabla y el `SchoolSelect`
 * reflejen el cambio.
 */
export function useSaveSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: SchoolFormValues }) =>
      id ? mdmService.updateSchool(id, payload) : mdmService.createSchool(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: mdmKeys.schools }),
  });
}

/**
 * GET /document-catalog/ — catálogo de tipos de documento (cache 5 min).
 * `enabled` permite diferir la carga; en MDM se carga apenas monta la pantalla
 * porque la creación de actividades depende de él.
 */
export function useDocumentCatalog(enabled = true) {
  return useQuery({
    queryKey: mdmKeys.documentCatalog,
    queryFn: documentCatalogService.getDocumentCatalog,
    staleTime: FIVE_MINUTES,
    enabled,
  });
}

/**
 * POST /activities/ — crea una actividad con plantilla de trámite.
 * Invalida todas las listas de actividades del dominio de intake (la lista
 * compartida es por programa: `['intake', 'activities', programId]`), para que
 * la tabla MDM y las listas de `carga-datos`/`triaje` queden actualizadas.
 */
export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateActivityPayload) => mdmService.createActivity(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intake', 'activities'] });
    },
  });
}