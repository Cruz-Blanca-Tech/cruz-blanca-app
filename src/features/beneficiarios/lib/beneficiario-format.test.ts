import { describe, expect, it } from 'vitest';
import { getFullName, getInitials, maskDni, maskName } from './beneficiario-format';

describe('presentación del beneficiario', () => {
  it('arma nombre completo e iniciales', () => {
    expect(getFullName({ first_name: 'Ana', last_name: 'Quispe' })).toBe('Ana Quispe');
    expect(getInitials({ first_name: 'ana', last_name: 'quispe' })).toBe('AQ');
    expect(getInitials({ first_name: ' ', last_name: '' })).toBe('?');
  });
});

describe('enmascarado para el rol Visualizador (protección de datos personales)', () => {
  it('muestra solo los últimos 4 dígitos del DNI', () => {
    expect(maskDni('12345678')).toBe('5678');
  });

  it('reduce el nombre a iniciales con máximo 4 asteriscos por palabra', () => {
    expect(maskName('Carlos Andrés Condori')).toBe('C A**** C****');
    expect(maskName('Li Wu')).toBe('L W*');
  });
});
