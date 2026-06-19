import { Lightbulb } from 'lucide-react';

export function OcrHelpNote() {
  return (
    <div className="flex gap-2.5 rounded-lg border border-info/20 bg-info-light px-3.5 py-3">
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-info-dark" />
      <p className="font-data text-xs leading-relaxed text-info-dark">
        <strong className="font-medium">Para mejores resultados:</strong>{' '}
        asegúrate de que la ficha esté bien iluminada, sin sombras y con
        resolución mínima de 200 DPI. Las fichas muy inclinadas o con texto
        manuscrito ilegible reducen la confianza del OCR.
      </p>
    </div>
  );
}
