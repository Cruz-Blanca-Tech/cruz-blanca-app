import { Suspense } from 'react';
import { BrandPanel } from '@/features/auth/components/brand-panel';
import { LoginCard } from '@/features/auth/components/login-card';

export default function AuthPage() {
  return (
    <main className="grid min-h-screen w-full grid-rows-[220px_1fr] md:grid-cols-2 md:grid-rows-1">
      <BrandPanel />
      <section className="flex items-center justify-center bg-card px-6 py-12 md:px-10">
        <Suspense fallback={null}>
          <LoginCard />
        </Suspense>
      </section>
    </main>
  );
}
