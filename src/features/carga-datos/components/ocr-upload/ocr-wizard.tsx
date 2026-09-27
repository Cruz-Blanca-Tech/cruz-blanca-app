'use client';

import { useCallback, useState } from 'react';

import { useCargaDatosStore } from '../../stores/carga-datos-store';
import type { CreateBatchResponse } from '../../schemas/create-batch-schema';
import type { BatchSummary } from '../../types';

import { OcrProcesandoStep } from './ocr-procesando-step';
import { OcrUploadStep } from './ocr-upload-step';

/** Resultado del batch + resumen de la carga, fijados al avanzar al Paso 2. */
interface BatchOutcome {
  result: CreateBatchResponse;
  summary: BatchSummary;
}

/**
 * Contenedor del flujo OCR. Maneja el paso actual (1: subir, 2: procesando) y
 * guarda el resultado del batch para mostrarlo en el Paso 2.
 */
export function OcrWizard() {
  const resetStore = useCargaDatosStore((s) => s.reset);
  const clearPickedFiles = useCargaDatosStore((s) => s.clearPickedFiles);
  const [outcome, setOutcome] = useState<BatchOutcome | null>(null);

  const handleBatchCreated = useCallback(
    (result: CreateBatchResponse, summary: BatchSummary) => {
      // El lote ya existe: los archivos de Drive ya no se pueden volver a
      // cargar como si fueran nuevos. Se limpian apenas se crea el batch y no
      // al volver atrás, para que un refresh a mitad de carga no los pierda.
      clearPickedFiles();
      setOutcome({ result, summary });
    },
    [clearPickedFiles]
  );

  const handleUploadMore = useCallback(() => {
    // Vuelve al Paso 1 con programa y actividad limpios y sin archivos.
    resetStore();
    setOutcome(null);
  }, [resetStore]);

  if (outcome) {
    return (
      <OcrProcesandoStep
        result={outcome.result}
        summary={outcome.summary}
        onUploadMore={handleUploadMore}
      />
    );
  }

  return <OcrUploadStep onBatchCreated={handleBatchCreated} />;
}
