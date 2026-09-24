import { BeneficiarioProfileCard } from '@/features/beneficiarios/components/beneficiario-profile-card';

export default function NuevoBeneficiarioPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <BeneficiarioProfileCard mode="create" />
    </div>
  );
}
