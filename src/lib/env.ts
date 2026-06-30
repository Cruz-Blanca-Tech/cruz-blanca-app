import { z } from 'zod';

/**
 * Variables de entorno públicas (prefijo `NEXT_PUBLIC_`, inlined por Next en
 * build) seguras para el cliente.
 *
 * Next solo inyecta accesos por nombre **literal** a `process.env.NEXT_PUBLIC_*`
 * —no expande destructuring ni accesos dinámicos (`process.env[x]`)—, por eso se
 * listan una a una en vez de iterarlas.
 *
 * Son opcionales a propósito: la UI degrada con un mensaje cuando faltan, no debe
 * romper en el arranque. `.catch(undefined)` garantiza que un valor ausente,
 * vacío o inválido se normalice a `undefined` en vez de lanzar.
 */
const optionalNonEmpty = z.string().trim().min(1).optional().catch(undefined);

const clientEnvSchema = z.object({
  googleClientId: optionalNonEmpty,
  googleApiKey: optionalNonEmpty,
});

export const clientEnv = clientEnvSchema.parse({
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || undefined,
  googleApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || undefined,
});
