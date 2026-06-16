import { Suspense } from 'react';
import { LoginCard } from '@/features/auth/components/login-card';

export default function AuthPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <Suspense fallback={null}>
        <LoginCard />
      </Suspense>
    </main>
  );
}
