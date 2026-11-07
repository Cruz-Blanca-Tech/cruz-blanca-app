import { describe, expect, it } from 'vitest';
import { getPdfFailureDetail } from './batch-pdf-failure';

describe('getPdfFailureDetail', () => {
  it('devuelve null sin fallo de PDF', () => {
    expect(getPdfFailureDetail(null)).toBeNull();
    expect(getPdfFailureDetail(undefined)).toBeNull();
    expect(getPdfFailureDetail('Error de sincronización con MDM')).toBeNull();
  });

  it('extrae el detalle', () => {
    expect(getPdfFailureDetail('PDF consolidado no generado: tras 3 intentos (drive caido)')).toBe(
      'tras 3 intentos (drive caido)'
    );
  });

  it('da un texto por defecto si no hay detalle', () => {
    expect(getPdfFailureDetail('PDF consolidado no generado')).toBe('Intente generarlo de nuevo.');
  });
});
