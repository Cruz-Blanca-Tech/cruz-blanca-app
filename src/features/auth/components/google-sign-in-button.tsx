'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/auth-store';

interface GoogleCredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            ux_mode?: 'popup' | 'redirect';
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

const GSI_SCRIPT_ID = 'google-identity-services-script';
const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

// Google limita el ancho del botón renderizado al rango [200, 400].
const GSI_MIN_WIDTH = 200;
const GSI_MAX_WIDTH = 400;

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('window unavailable'));
    if (window.google?.accounts?.id) return resolve();
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
 * El backend espera el ID token (credential JWT) que solo emite Google
 * Identity Services. Para conservar ese flujo real y a la vez mostrar un
 * botón con estilo propio, se renderiza el botón oficial de GSI por encima
 * del botón visual, transparente: el clic llega al botón de Google (que
 * devuelve el credential) mientras el usuario ve el diseño de la marca.
 */
export function GoogleSignInButton() {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [localError, setLocalError] = useState<string | null>(
    GOOGLE_CLIENT_ID ? null : 'Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID.'
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let cancelled = false;
    let observer: ResizeObserver | undefined;

    const handleCredential = async (response: GoogleCredentialResponse) => {
      try {
        await loginWithGoogle(response.credential);
        router.replace('/dashboard');
      } catch (err) {
        if (cancelled) return;
        setLocalError(err instanceof Error ? err.message : 'Error al iniciar sesión.');
      }
    };

    const renderButton = () => {
      const el = overlayRef.current;
      if (cancelled || !window.google || !el) return;
      const width = Math.min(
        GSI_MAX_WIDTH,
        Math.max(GSI_MIN_WIDTH, Math.round(el.getBoundingClientRect().width))
      );
      el.replaceChildren();
      window.google.accounts.id.renderButton(el, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'center',
        width,
      });
    };

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredential,
          ux_mode: 'popup',
        });
        renderButton();
        if (overlayRef.current && typeof ResizeObserver !== 'undefined') {
          observer = new ResizeObserver(() => renderButton());
          observer.observe(overlayRef.current);
        }
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setLocalError(err.message);
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [loginWithGoogle, router]);

  return (
    <div className="w-full">
      <div className="relative w-full">
        {/* Capa visible: botón con el estilo del diseño */}
        <div
          aria-hidden="true"
          data-loading={isLoading || undefined}
          className="flex w-full items-center justify-center gap-3 rounded-md border-[1.5px] border-border bg-card px-5 py-3 text-base font-medium text-foreground transition-all hover:border-brand hover:bg-slate-50 hover:shadow-[0_2px_8px_var(--overlay-brand10)] data-[loading]:opacity-60"
        >
          <GoogleIcon />
          {isLoading ? 'Conectando…' : 'Continuar con Google'}
        </div>

        {/* Capa real de GSI: transparente, captura el clic */}
        <div
          ref={overlayRef}
          aria-label="Iniciar sesión con Google"
          className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.0001]"
        />
      </div>

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
