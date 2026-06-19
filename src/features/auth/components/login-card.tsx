'use client';

import { useSearchParams } from 'next/navigation';
import { GoogleSignInButton } from './google-sign-in-button';
import { DevLoginButton } from './dev-login-button';

export function LoginCard() {
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get('session_expired') === 'true';

  return (
    <div className="flex w-full max-w-[380px] flex-col">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-brand">
          Iniciar sesión
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Accede con tu cuenta institucional
        </p>
      </header>

      <div className="my-7 h-[3px] w-10 rounded-sm bg-brand" />

      {sessionExpired && (
        <div
          role="alert"
          className="mb-6 rounded-md bg-warning-light px-4 py-3 text-sm text-warning-dark ring-1 ring-warning/30"
        >
          Tu sesión expiró. Inicia sesión nuevamente.
        </div>
      )}

      <GoogleSignInButton />

      {process.env.NODE_ENV !== 'production' && (
        <>
          <div className="flex w-full items-center gap-3 py-4">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">solo desarrollo</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <DevLoginButton />
        </>
      )}

      <p className="mt-7 text-center font-data text-xs leading-relaxed text-balance text-slate-400">
        Al continuar, aceptas el tratamiento de tus datos personales conforme a la{' '}
        <a href="#" className="text-info hover:underline">
          Política de Privacidad
        </a>{' '}
        de la Asociación Cruz Blanca y la Ley N.° 29733 — Ley de Protección de Datos
        Personales del Perú.
      </p>
    </div>
  );
}
