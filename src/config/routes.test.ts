import { describe, expect, it } from 'vitest';
import { ROLES } from '@/features/auth/types';
import { canAccess, findRouteAccess, isPublicRoute } from './routes';

describe('isPublicRoute', () => {
  it('solo /auth y sus subrutas son públicas', () => {
    expect(isPublicRoute('/auth')).toBe(true);
    expect(isPublicRoute('/auth/callback')).toBe(true);
    expect(isPublicRoute('/authx')).toBe(false);
    expect(isPublicRoute('/dashboard')).toBe(false);
  });
});

describe('findRouteAccess', () => {
  it('encuentra la regla por prefijo', () => {
    expect(findRouteAccess('/triaje/lote-1/caso-2')?.prefix).toBe('/triaje');
    expect(findRouteAccess('/no-existe')).toBeUndefined();
  });
});

describe('canAccess (RBAC del frontend)', () => {
  it('sin rol no hay acceso', () => {
    expect(canAccess('/dashboard', null)).toBe(false);
  });

  it('todos los roles ven el dashboard y el listado de beneficiarios', () => {
    for (const role of Object.values(ROLES)) {
      expect(canAccess('/dashboard', role)).toBe(true);
      expect(canAccess('/beneficiarios', role)).toBe(true);
    }
  });

  it('el visualizador no carga datos, no hace triaje ni descarga reportes', () => {
    expect(canAccess('/carga-datos', ROLES.VISUALIZADOR)).toBe(false);
    expect(canAccess('/triaje/lote-1', ROLES.VISUALIZADOR)).toBe(false);
    expect(canAccess('/reportes', ROLES.VISUALIZADOR)).toBe(false);
  });

  it('el visualizador no abre fichas ni registra beneficiarios (datos sin enmascarar)', () => {
    expect(canAccess('/beneficiarios/123', ROLES.VISUALIZADOR)).toBe(false);
    expect(canAccess('/beneficiarios/nuevo', ROLES.VISUALIZADOR)).toBe(false);
    expect(canAccess('/beneficiarios/123/editar', ROLES.VISUALIZADOR)).toBe(false);
    for (const role of [ROLES.ADMIN, ROLES.OPERATIVO, ROLES.REVISOR]) {
      expect(canAccess('/beneficiarios/123', role)).toBe(true);
      expect(canAccess('/reportes', role)).toBe(true);
    }
  });

  it('los datos maestros (MDM) son solo para admin y operativo', () => {
    expect(canAccess('/mdm/colegios', ROLES.ADMIN)).toBe(true);
    expect(canAccess('/mdm/actividades', ROLES.OPERATIVO)).toBe(true);
    expect(canAccess('/mdm/colegios', ROLES.REVISOR)).toBe(false);
    expect(canAccess('/mdm/actividades', ROLES.VISUALIZADOR)).toBe(false);
  });

  it('solo admin y operativo gestionan usuarios', () => {
    expect(canAccess('/usuarios', ROLES.ADMIN)).toBe(true);
    expect(canAccess('/usuarios', ROLES.OPERATIVO)).toBe(true);
    expect(canAccess('/usuarios', ROLES.REVISOR)).toBe(false);
    expect(canAccess('/usuarios', ROLES.VISUALIZADOR)).toBe(false);
  });
});
