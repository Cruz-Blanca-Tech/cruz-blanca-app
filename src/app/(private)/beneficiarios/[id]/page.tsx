'use client';

import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useBeneficiary } from '@/features/beneficiarios/hooks/use-beneficiarios-queries';
import { BeneficiarioProfileCard } from '@/features/beneficiarios/components/beneficiario-profile-card';

export default function BeneficiaryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: beneficiary, isFetching, isError } = useBeneficiary(id);

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Cargando beneficiario...</span>
      </div>
    );
  }

  if (isError || !beneficiary) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <p className="text-destructive font-medium">No se pudo cargar la información del beneficiario.</p>
        <Button variant="outline" onClick={() => router.push('/beneficiarios')}>
          Volver a la lista
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <BeneficiarioProfileCard mode="profile" data={beneficiary} id={id} />
    </div>
  );
}
