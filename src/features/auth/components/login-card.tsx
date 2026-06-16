'use client';

import { useSearchParams } from 'next/navigation';
import { GoogleSignInButton } from './google-sign-in-button';

export function LoginCard() {
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get('session_expired') === 'true';

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-sm ring-1 ring-zinc-200">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Cruz Blanca
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Gestión Documental Inteligente
        </p>
      </div>

      {sessionExpired && (
        <div
          role="alert"
          className="mb-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
        >
          Tu sesión expiró. Inicia sesión nuevamente.
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-zinc-600">
          Inicia sesión con tu cuenta institucional.
        </p>
        <GoogleSignInButton />
      </div>
    </div>
  );
}
