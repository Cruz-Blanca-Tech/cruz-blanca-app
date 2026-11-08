import { describe, expect, it } from 'vitest';
import { buildSavedMessage } from './saved-message';

const err = (rule_description: string) => ({ severity: 'ERROR', rule_description });

describe('buildSavedMessage', () => {
  it('sin errores devuelve el mensaje simple', () => {
    expect(buildSavedMessage([])).toBe('Correcciones guardadas.');
    expect(buildSavedMessage([{ severity: 'WARNING', rule_description: 'x' }])).toBe(
      'Correcciones guardadas.'
    );
  });

  it('nombra la observación pendiente', () => {
    const msg = buildSavedMessage([err('El DNI del apoderado es obligatorio.')]);
    expect(msg).toContain('Quedan 1 observación por resolver');
    expect(msg).toContain('El DNI del apoderado es obligatorio.');
  });

  it('lista las 3 primeras y cuenta el resto; ignora WARNING', () => {
    const msg = buildSavedMessage([
      err('a'), err('b'), err('c'), err('d'), err('e'),
      { severity: 'WARNING', rule_description: 'no cuenta' },
    ]);
    expect(msg).toContain('Quedan 5 observaciones');
    expect(msg).toContain('… y 2 más');
    expect(msg).not.toContain('no cuenta');
  });
});
