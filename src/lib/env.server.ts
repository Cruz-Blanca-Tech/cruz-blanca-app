import { z } from 'zod';

/**
 * Variables de entorno del servidor: NO llevan prefijo `NEXT_PUBLIC_`, por lo
 * que solo existen en el runtime de Node y nunca se exponen al navegador. El
 * sufijo `.server` y el hecho de que solo lo importen los route handlers lo
 * mantienen fuera del bundle de cliente.
 *
 * Centraliza el fallback `BACKEND_BASE_URL` → `NEXT_PUBLIC_BACKEND_BASE_URL` que
 * antes se repetía en cada route handler. La URL se valida solo si está presente
 * (`.catch(undefined)` evita romper el arranque); los handlers responden 500
 * cuando falta, igual que hoy.
 */
const serverEnvSchema = z.object({
  backendBaseUrl: z.url().optional().catch(undefined),
});

export const serverEnv = serverEnvSchema.parse({
  backendBaseUrl:
    process.env.BACKEND_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
    undefined,
});
