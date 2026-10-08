import { describe, expect, it } from 'vitest';
import { formatDay, formatMonth, resolveLabel } from './dashboard-format';

describe('formato de ejes del dashboard', () => {
  it('formatea días ISO', () => {
    expect(formatDay('2026-07-01')).toBe('01 jul');
    expect(formatDay('2026-13-01')).toBe('2026-13-01');
    expect(formatDay('basura')).toBe('basura');
  });

  it('formatea meses ISO', () => {
    expect(formatMonth('2026-06')).toBe('jun 26');
    expect(formatMonth('2026-00')).toBe('2026-00');
  });

  it('resuelve etiquetas con la leyenda del backend', () => {
    expect(resolveLabel({ APPROVED: 'Aprobado' }, 'APPROVED')).toBe('Aprobado');
    expect(resolveLabel(null, 'REJECTED')).toBe('REJECTED');
  });
});
