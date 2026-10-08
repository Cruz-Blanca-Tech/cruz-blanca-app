import { describe, expect, it } from 'vitest';
import {
  hasConflictingExclusiveRole,
  isBeneficiaryMinor,
  isExclusiveRelationship,
  isValidDni,
  validateAdultDni,
  validateAdultsOnSubmit,
} from './beneficiary-rules';

/** Fecha local "YYYY-MM-DDT12:00:00" a `years` años y `days` días de hoy (sin desfase de zona horaria). */
function localDate(years: number, days = 0): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T12:00:00`;
}

describe('isValidDni', () => {
  it('acepta exactamente 8 dígitos', () => {
    expect(isValidDni('12345678')).toBe(true);
    expect(isValidDni(' 12345678 ')).toBe(true);
  });

  it('rechaza longitudes distintas o caracteres no numéricos', () => {
    expect(isValidDni('1234567')).toBe(false);
    expect(isValidDni('123456789')).toBe(false);
    expect(isValidDni('1234567A')).toBe(false);
    expect(isValidDni('')).toBe(false);
  });
});

describe('isBeneficiaryMinor', () => {
  it('devuelve null si la fecha está vacía o es inválida', () => {
    expect(isBeneficiaryMinor(null)).toBeNull();
    expect(isBeneficiaryMinor(undefined)).toBeNull();
    expect(isBeneficiaryMinor('no-es-fecha')).toBeNull();
  });

  it('identifica menores y mayores de edad', () => {
    expect(isBeneficiaryMinor(localDate(10))).toBe(true);
    expect(isBeneficiaryMinor(localDate(30))).toBe(false);
  });

  it('respeta el límite exacto de 18 años', () => {
    expect(isBeneficiaryMinor(localDate(18))).toBe(false); // cumple 18 hoy
    expect(isBeneficiaryMinor(localDate(18, 1))).toBe(true); // cumple 18 mañana
  });
});

describe('parentescos exclusivos', () => {
  it('solo padre y madre son exclusivos', () => {
    expect(isExclusiveRelationship('FATHER')).toBe(true);
    expect(isExclusiveRelationship('MOTHER')).toBe(true);
    expect(isExclusiveRelationship('GRANDMOTHER')).toBe(false);
  });

  it('detecta un segundo padre o madre en la lista', () => {
    const adults = [{ relationship: 'FATHER' }, { relationship: 'MOTHER' }];
    expect(hasConflictingExclusiveRole(adults, 1, 'FATHER')).toBe(true);
    expect(hasConflictingExclusiveRole(adults, 0, 'FATHER')).toBe(false);
  });

  it('acepta el campo role del formulario y no restringe roles no exclusivos', () => {
    expect(hasConflictingExclusiveRole([{ role: 'MOTHER' }], 1, 'MOTHER')).toBe(true);
    expect(hasConflictingExclusiveRole([{ role: 'UNCLE' }], 1, 'UNCLE')).toBe(false);
  });
});

describe('validateAdultDni', () => {
  const adults = [{ dni: '11111111' }, { dni: '22222222' }];

  it('exige DNI y distingue al apoderado', () => {
    expect(validateAdultDni('', 0, '99999999', adults, true)).toBe('El apoderado debe tener DNI obligatorio.');
    expect(validateAdultDni(null, 0, '99999999', adults)).toBe('El DNI es obligatorio para registrar al familiar.');
  });

  it('valida formato, coincidencia con el beneficiario y duplicados', () => {
    expect(validateAdultDni('123', 0, '99999999', adults)).toBe('El DNI debe tener exactamente 8 dígitos numéricos.');
    expect(validateAdultDni('99999999', 0, '99999999', adults)).toBe('Coincide con el DNI del beneficiario.');
    expect(validateAdultDni('22222222', 0, '99999999', adults)).toBe('DNI duplicado con otro familiar.');
  });

  it('devuelve null cuando el DNI es válido', () => {
    expect(validateAdultDni(' 11111111 ', 0, '99999999', adults)).toBeNull();
  });
});

describe('validateAdultsOnSubmit', () => {
  it('acepta una lista válida', () => {
    const adults = [
      { dni: '11111111', full_name: 'Juan Quispe', relationship: 'FATHER' },
      { dni: '22222222', first_name: 'Rosa', last_name: 'Flores', role: 'MOTHER' },
    ];
    expect(validateAdultsOnSubmit(adults, '99999999')).toBeNull();
  });

  it('usa la etiqueta del parentesco cuando falta el nombre', () => {
    const msg = validateAdultsOnSubmit([{ dni: '', relationship: 'FATHER' }], '99999999');
    expect(msg).toContain("'Padre'");
    expect(msg).toContain('DNI obligatorio');
  });

  it('exige nombre completo', () => {
    expect(validateAdultsOnSubmit([{ dni: '11111111' }], '99999999')).toBe(
      'El familiar con DNI 11111111 debe tener nombre completo.'
    );
  });

  it('rechaza DNI del beneficiario y DNIs repetidos', () => {
    expect(validateAdultsOnSubmit([{ dni: '99999999', full_name: 'Ana' }], '99999999')).toContain(
      'coincide con el DNI del beneficiario'
    );
    const repetidos = [
      { dni: '11111111', full_name: 'Ana' },
      { dni: '11111111', full_name: 'Luis' },
    ];
    expect(validateAdultsOnSubmit(repetidos, '99999999')).toContain('está repetido');
  });
});
