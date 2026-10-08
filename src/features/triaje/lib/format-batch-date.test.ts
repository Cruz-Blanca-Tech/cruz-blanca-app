import { describe, expect, it } from 'vitest';
import { formatBatchDate } from './format-batch-date';

const MIN = 60_000;
const hace = (ms: number) => new Date(Date.now() - ms).toISOString();

describe('formatBatchDate', () => {
  it('maneja fechas vacías o inválidas', () => {
    expect(formatBatchDate(null)).toEqual({ absolute: 'Sin fecha', relative: '' });
    expect(formatBatchDate('no-es-fecha')).toEqual({ absolute: 'Sin fecha', relative: '' });
  });

  it('genera la etiqueta relativa', () => {
    expect(formatBatchDate(hace(10_000)).relative).toBe('hace instantes');
    expect(formatBatchDate(hace(5 * MIN)).relative).toBe('hace 5 min');
    expect(formatBatchDate(hace(3 * 60 * MIN)).relative).toBe('hace 3 h');
    expect(formatBatchDate(hace(25 * 60 * MIN)).relative).toBe('ayer');
    expect(formatBatchDate(hace(3 * 24 * 60 * MIN)).relative).toBe('hace 3 d');
  });

  it('trata fechas futuras como recientes', () => {
    expect(formatBatchDate(new Date(Date.now() + 5 * MIN).toISOString()).relative).toBe('hace instantes');
  });

  it('formatea la fecha absoluta con año y hora', () => {
    const { absolute } = formatBatchDate('2026-05-07T14:48:00');
    expect(absolute).toContain('2026');
    expect(absolute).toContain('14:48');
  });
});
