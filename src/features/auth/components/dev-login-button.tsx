'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '../stores/auth-store';

/**
 * Botón SOLO para desarrollo: inicia sesión usando el atajo `test-token`
 * que el backend acepta cuando ENVIRONMENT=development. Permite ver el
 * frontend autenticado sin necesidad de credenciales reales de Google.
 *
 * Se renderiza únicamente cuando NODE_ENV !== 'production'.
 */
export function DevLoginButton() {
  const router = useRouter();
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDevLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle('test-token');
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión (dev).');
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={handleDevLogin}
        disabled={loading}
      >
        <Wrench />
        {loading ? 'Entrando…' : 'Entrar (modo dev · test-token)'}
      </Button>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
