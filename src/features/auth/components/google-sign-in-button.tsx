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

const GSI_SCRIPT_ID = 'google-identity-services-script';
const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

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

export function GoogleSignInButton() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setLocalError('Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID.');
      return;
    }

    let cancelled = false;

    const handleCredential = async (response: GoogleCredentialResponse) => {
      try {
        await loginWithGoogle(response.credential);
        router.replace('/dashboard');
      } catch (err) {
        if (cancelled) return;
        setLocalError(err instanceof Error ? err.message : 'Error al iniciar sesión.');
      }
    };

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google || !containerRef.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredential,
          ux_mode: 'popup',
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: 320,
        });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setLocalError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [loginWithGoogle, router]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={containerRef} aria-label="Iniciar sesión con Google" />
      {isLoading && (
        <p className="text-sm text-zinc-500">Verificando sesión…</p>
      )}
      {localError && (
        <p className="text-sm text-red-600" role="alert">
          {localError}
        </p>
      )}
    </div>
  );
}
