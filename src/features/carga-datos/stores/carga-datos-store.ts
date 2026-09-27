'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { PickedFile } from '@/shared/drive/types';

interface CargaDatosState {
  /** Programa seleccionado en OCR Paso 1. Se reutiliza al crear una actividad. */
  selectedProgramId: string | null;
  /** Actividad seleccionada en OCR Paso 1 (incluye la recién creada). */
  selectedActivityId: string | null;
  /** Archivo (ficha escaneada) cargado en OCR Paso 1. */
  selectedFile: File | null;
  /**
   * Archivos ya tomados de Drive para el lote en curso.
   *
   * Vive en el store y no en el estado del componente a propósito: corregir el
   * agrupamiento de un lote de 200 archivos es un trabajo de rato, y perderlo
   * al recargar la página obligaba a volver a elegir los 200 uno por uno desde
   * el picker de Drive.
   */
  pickedFiles: PickedFile[];
  /**
   * Nombre de cada archivo tal como llegó de Drive, indexado por `source_id`.
   *
   * `file_name` se sobrescribe cuando el operador asigna un archivo a un
   * expediente, así que sin este mapa no se puede devolver un archivo a la
   * bandeja: se perdería el nombre que tenía y quedaría `90428351_DNIAP.jpg`
   * haciendo de "sin expediente".
   */
  originalNames: Record<string, string>;
  setSelectedProgramId: (programId: string | null) => void;
  setSelectedActivityId: (activityId: string | null) => void;
  setSelectedFile: (file: File | null) => void;
  /** Agrega archivos nuevos, deduplicando por `source_id`, y recuerda sus nombres. */
  addPickedFiles: (files: PickedFile[]) => void;
  /** Sobrescribe el `file_name` de un archivo (asignarlo a un expediente). */
  renamePickedFile: (sourceId: string, fileName: string) => void;
  removePickedFile: (sourceId: string) => void;
  clearPickedFiles: () => void;
  reset: () => void;
}

export const useCargaDatosStore = create<CargaDatosState>()(
  persist(
    (set) => ({
      selectedProgramId: null,
      selectedActivityId: null,
      selectedFile: null,
      pickedFiles: [],
      originalNames: {},

      setSelectedProgramId: (selectedProgramId) => set({ selectedProgramId }),
      setSelectedActivityId: (selectedActivityId) => set({ selectedActivityId }),
      setSelectedFile: (selectedFile) => set({ selectedFile }),

      addPickedFiles: (incoming) =>
        set((state) => {
          const bySourceId = new Map(
            state.pickedFiles.map((f) => [f.source_id, f])
          );
          const originalNames = { ...state.originalNames };
          for (const file of incoming) {
            bySourceId.set(file.source_id, file);
            // Solo se guarda la primera vez: después el `file_name` ya puede
            // estar retocado por una asignación y el original se perdió.
            if (!(file.source_id in originalNames)) {
              originalNames[file.source_id] = file.file_name;
            }
          }
          return { pickedFiles: Array.from(bySourceId.values()), originalNames };
        }),

      renamePickedFile: (sourceId, fileName) =>
        set((state) => ({
          pickedFiles: state.pickedFiles.map((f) =>
            f.source_id === sourceId ? { ...f, file_name: fileName } : f
          ),
        })),

      removePickedFile: (sourceId) =>
        set((state) => {
          const originalNames = { ...state.originalNames };
          delete originalNames[sourceId];
          return {
            pickedFiles: state.pickedFiles.filter((f) => f.source_id !== sourceId),
            originalNames,
          };
        }),

      clearPickedFiles: () => set({ pickedFiles: [], originalNames: {} }),

      reset: () =>
        set({
          selectedProgramId: null,
          selectedActivityId: null,
          selectedFile: null,
          pickedFiles: [],
          originalNames: {},
        }),
    }),
    {
      name: 'cruz-blanca-carga-datos',
      // `selectedFile` es un `File`: no se serializa y además no tiene sentido
      // después de recargar (el blob local se pierde). Se persiste solo lo que
      // son identificadores y nombres de Drive.
      partialize: (state) => ({
        selectedProgramId: state.selectedProgramId,
        selectedActivityId: state.selectedActivityId,
        pickedFiles: state.pickedFiles,
        originalNames: state.originalNames,
      }),
    }
  )
);
