import { redirect } from 'next/navigation';

/**
 * La edición ahora es inline en la página de perfil (/beneficiarios/[id]).
 * Esta ruta redirige automáticamente para no romper links existentes.
 */
export default function EditarBeneficiarioPage({ params }: { params: { id: string } }) {
  redirect(`/beneficiarios/${params.id}`);
}
