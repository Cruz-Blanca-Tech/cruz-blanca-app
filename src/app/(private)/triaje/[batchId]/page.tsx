import { BatchDetailScreen } from '@/features/triaje/components/batch-detail-screen';

/**
 * Detalle de un lote de triaje (/triaje/[batchId]). En Next 16 `params` es una
 * promesa, así que se resuelve con `await` antes de pasar el `batchId` al
 * componente raíz del feature (la página solo importa y renderiza).
 */
export default async function TriajeDetalleLotePage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  return <BatchDetailScreen batchId={batchId} />;
}
