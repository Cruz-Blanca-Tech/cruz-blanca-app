import { CaseCorrectionScreen } from '@/features/triaje/components/case-correction-screen';

/**
 * Corrección manual de un expediente EDUCA (/triaje/[batchId]/[caseId]?dni=…).
 *
 * En Next 16 `params` y `searchParams` son promesas, así que se resuelven con
 * `await` antes de pasar los identificadores al componente del feature (la página
 * solo importa y renderiza). Se llevan los TRES identificadores en la URL para
 * que la pantalla sobreviva a un F5: `batchId` + `caseId` como segmentos y el
 * `dni_reference` (estable) como query param. `caseId` alimenta los endpoints
 * `/educa`; `batchId` + `dni` alimentan el visor de documentos.
 */
export default async function TriajeCorreccionPage({
  params,
  searchParams,
}: {
  params: Promise<{ batchId: string; caseId: string }>;
  searchParams: Promise<{ dni?: string | string[] }>;
}) {
  const { batchId, caseId } = await params;
  const { dni } = await searchParams;
  const dniReference = Array.isArray(dni) ? (dni[0] ?? '') : (dni ?? '');

  return (
    <CaseCorrectionScreen
      batchId={batchId}
      caseId={caseId}
      dniReference={dniReference}
    />
  );
}
