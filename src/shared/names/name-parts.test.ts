import { describe, expect, it } from 'vitest';
import {
  composeFullName,
  composeSurnames,
  groupNameUnits,
  hasGivenNameAndSurname,
  splitFullName,
  splitSurnames,
} from './name-parts';

describe('HU-004: apellidos separados', () => {
  it('separa apellido paterno y materno', () => {
    expect(splitSurnames('Quispe Flores')).toEqual({ paternal: 'Quispe', maternal: 'Flores' });
    expect(splitSurnames('  QUISPE   FLORES ')).toEqual({ paternal: 'QUISPE', maternal: 'FLORES' });
  });

  it('un solo apellido va al paterno', () => {
    expect(splitSurnames('Quispe')).toEqual({ paternal: 'Quispe', maternal: '' });
    expect(splitSurnames('')).toEqual({ paternal: '', maternal: '' });
  });

  it('respeta apellidos compuestos con partículas', () => {
    expect(splitSurnames('De La Cruz Pérez')).toEqual({ paternal: 'De La Cruz', maternal: 'Pérez' });
    expect(splitSurnames('Quispe del Águila')).toEqual({ paternal: 'Quispe', maternal: 'del Águila' });
    expect(groupNameUnits('María de los Ángeles Rojas')).toEqual(['María', 'de los Ángeles', 'Rojas']);
  });

  it('compone en el formato del maestro y es reversible', () => {
    expect(composeSurnames(' Quispe ', 'Flores')).toBe('Quispe Flores');
    expect(composeSurnames('Quispe', '')).toBe('Quispe');
    const parts = splitSurnames('San Martín Huamán');
    expect(composeSurnames(parts.paternal, parts.maternal)).toBe('San Martín Huamán');
  });
});

describe('HU-004: nombre completo de adultos', () => {
  it('separa nombres, apellido paterno y materno', () => {
    expect(splitFullName('Juan Carlos Quispe Mamani')).toEqual({
      givenNames: 'Juan Carlos',
      paternal: 'Quispe',
      maternal: 'Mamani',
    });
    expect(splitFullName('Rosa Flores')).toEqual({ givenNames: 'Rosa', paternal: 'Flores', maternal: '' });
    expect(splitFullName('Rosa')).toEqual({ givenNames: 'Rosa', paternal: '', maternal: '' });
  });

  it('compone el nombre completo', () => {
    expect(composeFullName('Juan Carlos', 'Quispe', 'Mamani')).toBe('Juan Carlos Quispe Mamani');
    expect(composeFullName('Rosa', 'De La Cruz', '')).toBe('Rosa De La Cruz');
  });

  it('exige al menos un nombre y un apellido', () => {
    expect(hasGivenNameAndSurname('Juan Quispe')).toBe(true);
    expect(hasGivenNameAndSurname('Juan')).toBe(false);
    expect(hasGivenNameAndSurname('')).toBe(false);
  });
});
