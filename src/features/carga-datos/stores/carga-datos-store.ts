'use client';

import { create } from 'zustand';

interface CargaDatosState {
  /** Programa seleccionado en OCR Paso 1. Se reutiliza al crear una actividad. */
  selectedProgramId: string | null;
  /** Actividad seleccionada en OCR Paso 1 (incluye la recién creada). */
  selectedActivityId: string | null;
  /** Archivo (ficha escaneada) cargado en OCR Paso 1. */
  selectedFile: File | null;
  setSelectedProgramId: (programId: string | null) => void;
  setSelectedActivityId: (activityId: string | null) => void;
  setSelectedFile: (file: File | null) => void;
  reset: () => void;
}

export const useCargaDatosStore = create<CargaDatosState>((set) => ({
  selectedProgramId: null,
  selectedActivityId: null,
  selectedFile: null,
  setSelectedProgramId: (selectedProgramId) => set({ selectedProgramId }),
  setSelectedActivityId: (selectedActivityId) => set({ selectedActivityId }),
  setSelectedFile: (selectedFile) => set({ selectedFile }),
  reset: () =>
    set({
      selectedProgramId: null,
      selectedActivityId: null,
      selectedFile: null,
    }),
}));
