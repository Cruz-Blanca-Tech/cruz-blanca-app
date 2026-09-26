'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Hook que indica si el componente ya se montó en el cliente.
 * Se utiliza para evitar discrepancias de hidratación (hydration mismatches)
 * cuando propiedades como `disabled` o placeholders dependen de estados que
 * cambian en el cliente al montar (como TanStack Query `isLoading`).
 *
 * Implementación con `useSyncExternalStore` (patrón canónico de React 18+):
 * el snapshot de servidor es `false` y el de cliente `true`, por lo que la
 * transición ocurre en la hidratación sin necesidad de `setState` en un efecto.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,   // cliente
    () => false   // servidor
  );
}