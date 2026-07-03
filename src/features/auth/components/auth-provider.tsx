'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hydrateSession = useAuthStore((s) => s.hydrateSession);

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  return <>{children}</>;
}
