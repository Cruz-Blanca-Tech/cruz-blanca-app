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
 * guarda el resultado del batch para mostrarlo en el Paso 2. Cada paso se
 * renderiza de forma exclusiva, por lo que volver al Paso 1 remonta el
 * formulario y limpia los archivos seleccionados.
 */
export function OcrWizard() {
  const resetStore = useCargaDatosStore((s) => s.reset);
  const [outcome, setOutcome] = useState<BatchOutcome | null>(null);

  const handleBatchCreated = useCallback(
    (result: CreateBatchResponse, summary: BatchSummary) => {
      setOutcome({ result, summary });
    },
    []
  );

  const handleUploadMore = useCallback(() => {
    // Resetea programa/actividad y vuelve al Paso 1 (el remontaje limpia los
    // archivos seleccionados, que viven en el estado local de OcrUploadStep).
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
