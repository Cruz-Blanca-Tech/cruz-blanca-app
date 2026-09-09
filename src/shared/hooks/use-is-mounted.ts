'use client';

import { useEffect, useState } from 'react';

/**
 * Hook que indica si el componente ya se montó en el cliente.
 * Se utiliza para evitar discrepancias de hidratación (hydration mismatches)
 * cuando propiedades como `disabled` o placeholders dependen de estados que
 * cambian en el cliente al montar (como TanStack Query `isLoading`).
 */
export function useIsMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
