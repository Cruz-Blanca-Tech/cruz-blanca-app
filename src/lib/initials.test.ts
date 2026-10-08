import { describe, expect, it } from 'vitest';
import { getInitials } from './initials';

describe('getInitials', () => {
  it('toma las dos primeras palabras', () => {
    expect(getInitials('Carmen Rosa Huamán')).toBe('CR');
    expect(getInitials('  ana  ')).toBe('A');
  });

  it('devuelve "?" si el nombre está vacío', () => {
    expect(getInitials('   ')).toBe('?');
  });
});
