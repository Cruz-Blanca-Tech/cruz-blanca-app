import { describe, expect, it } from 'vitest';
import {
  getPersonSurnames,
  getPrimaryPaternalSurname,
  isNoiseText,
  normalizeNameToken,
  separateChildNameAndSurnames,
} from './name-separator';

const PADRE = 'Juan Quispe Mamani';
const MADRE = 'Rosa Flores Huaman';

describe('normalizeNameToken', () => {
  it('quita tildes, números y símbolos y pasa a mayúsculas', () => {
    expect(normalizeNameToken('José Pérez 123')).toBe('JOSE PEREZ');
    expect(normalizeNameToken('')).toBe('');
  });
});

describe('apellidos de una persona', () => {
  it('obtiene los apellidos según la cantidad de palabras', () => {
    expect(getPersonSurnames('Juan Carlos Quispe Mamani')).toEqual(['QUISPE', 'MAMANI']);
    expect(getPersonSurnames('Juan Quispe Mamani')).toEqual(['QUISPE', 'MAMANI']);
    expect(getPersonSurnames('Juan Quispe')).toEqual(['QUISPE']);
    expect(getPersonSurnames(null)).toEqual([]);
  });

  it('obtiene el apellido paterno principal', () => {
    expect(getPrimaryPaternalSurname('Juan Carlos Quispe Mamani')).toBe('QUISPE');
    expect(getPrimaryPaternalSurname('Rosa Flores')).toBe('FLORES');
    expect(getPrimaryPaternalSurname(undefined)).toBeNull();
  });
});

describe('isNoiseText', () => {
  it('detecta valores basura típicos del OCR', () => {
    expect(isNoiseText('s/n')).toBe(true);
    expect(isNoiseText('12')).toBe(true);
    expect(isNoiseText('')).toBe(true);
    expect(isNoiseText('Quispe')).toBe(false);
  });
});

describe('separateChildNameAndSurnames', () => {
  it('mueve los apellidos del padre y la madre desde el campo de nombres', () => {
    expect(separateChildNameAndSurnames('Luis Quispe Flores', '', PADRE, MADRE)).toEqual({
      firstName: 'Luis',
      lastName: 'Quispe Flores',
    });
  });

  it('antepone el apellido paterno cuando el apellido existente es el materno', () => {
    expect(separateChildNameAndSurnames('Ana Quispe', 'Flores', PADRE, MADRE)).toEqual({
      firstName: 'Ana',
      lastName: 'Quispe Flores',
    });
  });

  it('separa un apellido pegado al nombre por el OCR', () => {
    expect(separateChildNameAndSurnames('LuisQuispe', '', PADRE, null)).toEqual({
      firstName: 'Luis',
      lastName: 'QUISPE',
    });
  });

  it('no cambia nada si no hay datos de los padres', () => {
    expect(separateChildNameAndSurnames('Luis Quispe', 'Flores', null, null)).toEqual({
      firstName: 'Luis Quispe',
      lastName: 'Flores',
    });
  });

  it('no cambia nada si el nombre viene vacío', () => {
    expect(separateChildNameAndSurnames('', 'Quispe', PADRE, MADRE)).toEqual({
      firstName: '',
      lastName: 'Quispe',
    });
  });
});
