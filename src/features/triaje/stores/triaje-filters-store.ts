'use client';

import { create } from 'zustand';
import type { BatchStatus } from '../schemas/batch-status-schema';

/**
 * Estado de UI de los filtros y la paginación de la bandeja de triaje. Es SOLO
 * estado de presentación (la data vive en TanStack Query): qué programa,
 * actividad y estado están seleccionados y en qué página estamos. Estos valores
 * se pasan como params a `useBatches`, que filtra/pagina del lado del servidor.
 */
interface TriajeFiltersState {
  programId: string | null;
  activityId: string | null;
  status: string | null;
  /** Índice de página (0-based). Se traduce a `skip = page * pageSize`. */
  page: number;

  setProgramId: (programId: string | null) => void;
  setActivityId: (activityId: string | null) => void;
  setStatus: (status: string | null) => void;
  setPage: (page: number) => void;
  clear: () => void;
}

export const useTriajeFiltersStore = create<TriajeFiltersState>((set) => ({
  programId: null,
  activityId: null,
  status: null,
  page: 0,

  setProgramId: (programId) =>
    // Al cambiar de programa la actividad deja de ser válida y volvemos a la
    // primera página.
    set({ programId, activityId: null, page: 0 }),
  setActivityId: (activityId) => set({ activityId, page: 0 }),
  setStatus: (status) => set({ status, page: 0 }),
  setPage: (page) => set({ page }),
  clear: () => set({ programId: null, activityId: null, status: null, page: 0 }),
}));

/** Hay al menos un filtro activo (para mostrar el botón "Limpiar"). */
export function hasActiveFilters(state: TriajeFiltersState): boolean {
  return (
    state.programId !== null ||
    state.activityId !== null ||
    state.status !== null
  );
}
