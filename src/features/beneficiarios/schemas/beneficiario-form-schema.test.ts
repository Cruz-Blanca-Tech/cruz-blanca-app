import { describe, expect, it } from 'vitest';
import { beneficiarioFormSchema } from './beneficiario-form-schema';

const valido = {
  dni: '12345678',
  first_name: 'Luis',
  last_name: 'Quispe Flores',
  birth_date: '2015-03-01',
  guardian_ref: '0',
  emergency_contact_ref: '',
  related_adults: [{ first_name: 'Juan', last_name: 'Quispe', role: 'FATHER', dni: '11111111' }],
};

const mensajes = (data: unknown) => {
  const r = beneficiarioFormSchema.safeParse(data);
  return r.success ? [] : r.error.issues.map((i) => i.message);
};

describe('beneficiarioFormSchema', () => {
  it('acepta un beneficiario válido', () => {
    expect(beneficiarioFormSchema.safeParse(valido).success).toBe(true);
  });

  it('exige DNI de 8 dígitos numéricos', () => {
    expect(mensajes({ ...valido, dni: '1234567' })).toContain('El documento debe tener exactamente 8 dígitos');
    expect(mensajes({ ...valido, dni: '1234567A' })).toContain('El DNI debe tener exactamente 8 dígitos numéricos');
  });

  it('exige nombres, apellidos y fecha de nacimiento', () => {
    expect(mensajes({ ...valido, first_name: '' })).toContain('El nombre es obligatorio');
    expect(mensajes({ ...valido, last_name: '' })).toContain('Los apellidos son obligatorios');
    expect(mensajes({ ...valido, birth_date: '' })).toContain('La fecha de nacimiento es obligatoria');
  });

  it('permite como máximo 3 adultos relacionados', () => {
    const adulto = valido.related_adults[0];
    expect(mensajes({ ...valido, related_adults: [adulto, adulto, adulto, adulto] })).toContain(
      'Máximo 3 adultos relacionados'
    );
  });
});
