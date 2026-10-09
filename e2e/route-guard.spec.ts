import { expect, test } from '@playwright/test';
import { cookieHeader, fakeAccessToken } from './helpers';

/**
 * Protección de rutas (src/proxy.ts + src/config/routes.ts).
 * Se piden las páginas sin seguir redirecciones para verificar exactamente
 * a dónde envía el servidor a cada tipo de usuario.
 */
const PRIVATE_ROUTES = ['/dashboard', '/beneficiarios', '/carga-datos', '/triaje', '/reportes', '/usuarios'];

async function locationOf(
  request: import('@playwright/test').APIRequestContext,
  path: string,
  headers: Record<string, string> = {}
) {
  const res = await request.get(path, { headers, maxRedirects: 0 });
  return { status: res.status(), location: res.headers()['location'] ?? null };
}

function pathnameOf(location: string | null): string {
  if (!location) return '';
  return new URL(location, 'http://localhost').pathname;
}

test.describe('Usuario sin sesión', () => {
  for (const route of PRIVATE_ROUTES) {
    test(`${route} redirige a /auth`, async ({ request }) => {
      const { status, location } = await locationOf(request, route);
      expect(status).toBe(307);
      expect(pathnameOf(location)).toBe('/auth');
    });
  }

  test('/auth es accesible sin sesión', async ({ request }) => {
    const res = await request.get('/auth', { maxRedirects: 0 });
    expect(res.status()).toBe(200);
  });
});

test.describe('Token inválido o vencido', () => {
  test('token expirado se trata como sin sesión', async ({ request }) => {
    const token = fakeAccessToken('admin', -60);
    const { status, location } = await locationOf(request, '/dashboard', cookieHeader(token));
    expect(status).toBe(307);
    expect(pathnameOf(location)).toBe('/auth');
  });

  test('rol desconocido se trata como sin sesión', async ({ request }) => {
    const token = fakeAccessToken('superusuario');
    const { status, location } = await locationOf(request, '/dashboard', cookieHeader(token));
    expect(status).toBe(307);
    expect(pathnameOf(location)).toBe('/auth');
  });

  test('cookie que no es un JWT se trata como sin sesión', async ({ request }) => {
    const { status, location } = await locationOf(request, '/triaje', { cookie: 'access_token=basura' });
    expect(status).toBe(307);
    expect(pathnameOf(location)).toBe('/auth');
  });
});

test.describe('Control de acceso por rol (RBAC)', () => {
  test('usuario autenticado que entra a /auth va al dashboard', async ({ request }) => {
    const { status, location } = await locationOf(request, '/auth', cookieHeader(fakeAccessToken('operativo')));
    expect(status).toBe(307);
    expect(pathnameOf(location)).toBe('/dashboard');
  });

  for (const route of ['/usuarios', '/carga-datos', '/triaje', '/reportes', '/beneficiarios/nuevo', '/mdm/colegios']) {
    test(`VISUALIZADOR no puede entrar a ${route}`, async ({ request }) => {
      const { status, location } = await locationOf(request, route, cookieHeader(fakeAccessToken('visualizador')));
      expect(status).toBe(307);
      expect(pathnameOf(location)).toBe('/dashboard');
    });
  }

  for (const route of ['/dashboard', '/beneficiarios']) {
    test(`VISUALIZADOR sí puede entrar a ${route}`, async ({ request }) => {
      const res = await request.get(route, { headers: cookieHeader(fakeAccessToken('visualizador')), maxRedirects: 0 });
      expect(res.status()).toBe(200);
    });
  }

  for (const route of ['/usuarios', '/mdm/actividades']) {
    test(`REVISOR no puede entrar a ${route}`, async ({ request }) => {
      const { status, location } = await locationOf(request, route, cookieHeader(fakeAccessToken('revisor')));
      expect(status).toBe(307);
      expect(pathnameOf(location)).toBe('/dashboard');
    });
  }

  test('ADMIN puede entrar a todas las rutas privadas', async ({ request }) => {
    const token = fakeAccessToken('admin');
    for (const route of PRIVATE_ROUTES) {
      const res = await request.get(route, { headers: cookieHeader(token), maxRedirects: 0 });
      expect(res.status(), route).toBe(200);
    }
  });
});

