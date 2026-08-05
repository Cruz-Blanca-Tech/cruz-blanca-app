'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clientEnv } from '@/lib/env';
import { useAuthStore } from '../stores/auth-store';

interface GoogleCodeResponse {
  code: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient: (config: {
            client_id: string;
            scope: string;
            ux_mode?: 'popup' | 'redirect';
            callback: (response: GoogleCodeResponse) => void;
            error_callback?: (error: any) => void;
          }) => { requestCode: () => void };
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = clientEnv.googleClientId;

const GSI_SCRIPT_ID = 'google-identity-services-script';
const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const AUTH_SCOPES = 'email profile openid';

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('window unavailable'));
    if (window.google?.accounts?.oauth2) return resolve();
    const existing = document.getElementById(GSI_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load GSI')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.id = GSI_SCRIPT_ID;
    script.src = GSI_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

/**
 * Botón "Continuar con Google" con el aspecto del diseño Cruz Blanca.
 *
 * Utiliza el flujo Authorization Code (oauth2.initCodeClient) para poder pedir
 * los permisos de perfil y de Drive en la misma ventana de consentimiento.
 */
export function GoogleSignInButton() {
  const router = useRouter();
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [localError, setLocalError] = useState<string | null>(
    GOOGLE_CLIENT_ID ? null : 'Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID.'
  );

  // Pre-cargar el script al montar el componente para evitar que el
  // bloqueador de popups del navegador bloquee la ventana por perder
  // el contexto de interacción del usuario (user gesture).
  useEffect(() => {
    if (GOOGLE_CLIENT_ID) {
      loadGoogleScript().catch((err) => {
        console.error('Error pre-cargando GSI:', err);
      });
    }
  }, []);

  const handleLoginClick = async () => {
    if (!GOOGLE_CLIENT_ID || isLoading) return;
    
    setLocalError(null);
    try {
      
      if (!window.google?.accounts?.oauth2) {
        throw new Error('No se pudo cargar la librería de autenticación.');
      }

      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: `${AUTH_SCOPES} ${DRIVE_SCOPE}`,
        ux_mode: 'popup',
        callback: async (response) => {
          if (response.code) {
            try {
              await loginWithGoogle(response.code);
              router.replace('/dashboard');
            } catch (err) {
              setLocalError(err instanceof Error ? err.message : 'Error al iniciar sesión en el servidor.');
            }
          }
        },
        error_callback: (error) => {
          if (error?.type === 'popup_closed') {
             // El usuario cerró la ventana
             return;
          }
          setLocalError('No se pudo completar la autenticación con Google.');
        }
      });

      client.requestCode();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Error al iniciar sesión.');
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleLoginClick}
        disabled={isLoading || !GOOGLE_CLIENT_ID}
        aria-label="Iniciar sesión con Google"
        className="flex w-full items-center justify-center gap-3 rounded-md border-[1.5px] border-border bg-card px-5 py-3 text-base font-medium text-foreground transition-all hover:border-brand hover:bg-slate-50 hover:shadow-[0_2px_8px_var(--overlay-brand10)] disabled:opacity-60 disabled:pointer-events-none"
      >
        <GoogleIcon />
        {isLoading ? 'Conectando…' : 'Continuar con Google'}
      </button>

      {localError && (
        <p className="mt-3 text-sm text-error" role="alert">
          {localError}
        </p>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      className="size-5 shrink-0"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
