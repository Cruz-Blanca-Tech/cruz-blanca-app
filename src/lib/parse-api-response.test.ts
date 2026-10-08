import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { parseApiResponse } from './parse-api-response';

const schema = z.object({ id: z.number(), nombre: z.string() });

describe('parseApiResponse', () => {
  it('devuelve los datos tipados si cumplen el schema', () => {
    expect(parseApiResponse(schema, { id: 1, nombre: 'Educa' }, 'programas')).toEqual({ id: 1, nombre: 'Educa' });
  });

  it('falla con un mensaje legible si la respuesta no cumple el schema', () => {
    expect(() => parseApiResponse(schema, { id: '1' }, 'programas')).toThrow(
      'La respuesta de programas no tiene el formato esperado.'
    );
  });
});
