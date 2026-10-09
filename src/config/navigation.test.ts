import { describe, expect, it } from 'vitest';
import { ROLES } from '@/features/auth/types';
import { getActiveNavItem, getNavItemsForRole, NAV_ITEMS } from './navigation';

describe('getNavItemsForRole', () => {
  it('retorna array vacío si el rol es null', () => {
    expect(getNavItemsForRole(null)).toEqual([]);
  });

  it('admin ve todas las opciones de navegación', () => {
    const items = getNavItemsForRole(ROLES.ADMIN);
    expect(items.length).toBe(NAV_ITEMS.length);
  });

  it('visualizador no ve reportes ni triaje ni carga ni usuarios ni mdm', () => {
    const items = getNavItemsForRole(ROLES.VISUALIZADOR);
    const hrefs = items.map((i) => i.href);
    expect(hrefs).toContain('/dashboard');
    expect(hrefs).toContain('/beneficiarios');
    expect(hrefs).not.toContain('/reportes');
    expect(hrefs).not.toContain('/triaje');
    expect(hrefs).not.toContain('/carga-datos');
    expect(hrefs).not.toContain('/usuarios');
    expect(hrefs).not.toContain('/mdm/colegios');
  });

  it('revisor ve triaje y reportes pero no usuarios ni mdm', () => {
    const items = getNavItemsForRole(ROLES.REVISOR);
    const hrefs = items.map((i) => i.href);
    expect(hrefs).toContain('/triaje');
    expect(hrefs).toContain('/reportes');
    expect(hrefs).not.toContain('/usuarios');
    expect(hrefs).not.toContain('/mdm/colegios');
  });
});

describe('getActiveNavItem', () => {
  it('encuentra el item activo por coincidencia exacta o prefijo', () => {
    expect(getActiveNavItem('/dashboard')?.href).toBe('/dashboard');
    expect(getActiveNavItem('/beneficiarios/123')?.href).toBe('/beneficiarios');
    expect(getActiveNavItem('/ruta-desconocida')).toBeUndefined();
  });
});
