import { describe, expect, it } from 'vitest';
import { composeSurnames, splitFullName } from './name-parts';

/**
 * D17 (bandeja): el revisor debe ver el nombre del adulto repartido igual que lo
 * guarda el maestro (regla B2 de `educa_dossier_mapper.py`). Mismos casos que
 * `tests/test_d17_nombre_adulto_mdm.py` del backend. Datos ficticios.
 */
const adulto = (fullName: string, relationship: string, childLastName: string | null | undefined) => {
  const p = splitFullName(fullName, {
    childLastName,
    isParent: relationship === 'FATHER' || relationship === 'MOTHER',
  });
  return [p.givenNames, composeSurnames(p.paternal, p.maternal)];
};

describe('D17: casos originales (menor «LUIS PEREZ ROJAS», padre)', () => {
  it('nombre compuesto y dos apellidos', () => {
    expect(adulto('Juan Carlos Pérez Gómez', 'FATHER', 'PEREZ ROJAS')).toEqual(['Juan Carlos', 'Pérez Gómez']);
  });

  it('nombre compuesto y un apellido (caso con que el registro describe D17)', () => {
    expect(adulto('Juan Carlos Pérez', 'FATHER', 'PEREZ ROJAS')).toEqual(['Juan Carlos', 'Pérez']);
  });

  it('apellido con partícula', () => {
    expect(adulto('Pedro de la Cruz Huamán', 'FATHER', 'PEREZ ROJAS')).toEqual(['Pedro', 'de la Cruz Huamán']);
  });

  it('contraste: un nombre y dos apellidos', () => {
    expect(adulto('Rosa Pérez Gómez', 'FATHER', 'PEREZ ROJAS')).toEqual(['Rosa', 'Pérez Gómez']);
  });
});

describe('D17: ancla en los apellidos del menor (B2)', () => {
  it('madre con dos nombres y dos apellidos', () => {
    expect(adulto('Ana María Rojas Díaz', 'MOTHER', 'PEREZ ROJAS')).toEqual(['Ana María', 'Rojas Díaz']);
  });

  it('madre con dos nombres y un apellido', () => {
    expect(adulto('Ana María Rojas', 'MOTHER', 'PEREZ ROJAS')).toEqual(['Ana María', 'Rojas']);
  });

  it('madre con nombre igual a un apellido del menor: tope de 2 unidades', () => {
    expect(adulto('María Cruz Rojas Díaz', 'MOTHER', 'CRUZ ROJAS')).toEqual(['María Cruz', 'Rojas Díaz']);
  });

  it('padre con partícula: coincide por unidad', () => {
    expect(adulto('Pedro de la Cruz Huamán', 'FATHER', 'DE LA CRUZ ROJAS')).toEqual(['Pedro', 'de la Cruz Huamán']);
  });

  it('padre: coincidencia sin tildes', () => {
    expect(adulto('José Luis Núñez', 'FATHER', 'NUNEZ ROJAS')).toEqual(['José Luis', 'Núñez']);
  });

  it('prima (otro parentesco): no ancla en la última palabra', () => {
    expect(adulto('Rosa Huamán Pérez', 'OTHER', 'PEREZ ROJAS')).toEqual(['Rosa', 'Huamán Pérez']);
  });

  it('contacto de emergencia sin apellidos en común', () => {
    expect(adulto('Carmen Rosa Villanueva Torres', 'OTHER', 'PEREZ ROJAS')).toEqual(['Carmen Rosa', 'Villanueva Torres']);
  });

  it.each(['', '   ', null, undefined])('menor sin apellidos (%j): regla de respaldo, igual que hoy', (apellidos) => {
    expect(adulto('Juan Carlos Pérez', 'FATHER', apellidos)).toEqual(['Juan', 'Carlos Pérez']);
  });

  it('coincidencia que dejaría los nombres vacíos: regla de respaldo', () => {
    expect(adulto('Pérez Gómez', 'FATHER', 'PEREZ ROJAS')).toEqual(['Pérez', 'Gómez']);
  });

  it('el reparto con ancla separa paterno y materno en la pantalla', () => {
    expect(splitFullName('Ana María Rojas Díaz', { childLastName: 'PEREZ ROJAS', isParent: true })).toEqual({
      givenNames: 'Ana María',
      paternal: 'Rojas',
      maternal: 'Díaz',
    });
  });
});
