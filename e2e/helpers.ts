/**
 * Genera un JWT de prueba (sin firma válida). Sirve para E2E porque el proxy del
 * frontend (src/proxy.ts) solo LEE el rol y la expiración para decidir la
 * navegación; la verificación criptográfica real ocurre en el backend.
 */
export function fakeAccessToken(role: string, expiresInSeconds = 3600): string {
  const b64 = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const header = b64({ alg: 'HS256', typ: 'JWT' });
  const payload = b64({
    sub: 'e2e-user',
    email: 'e2e@cruz-blanca.org',
    role,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
  return `${header}.${payload}.firma-de-prueba`;
}

export function cookieHeader(token: string): Record<string, string> {
  return { cookie: `access_token=${token}` };
}
