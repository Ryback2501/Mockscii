import { describe, it, expect } from 'vitest';
import { normalizeHex, TABLE_COLORS } from '../../src/color-picker.js';

describe('normalizeHex', () => {
  it('expands 3-digit hex to 6-digit', () => {
    expect(normalizeHex('#fff')).toBe('#ffffff');
    expect(normalizeHex('#0a0')).toBe('#00aa00');
  });

  it('adds a missing leading hash and lowercases', () => {
    expect(normalizeHex('FF0000')).toBe('#ff0000');
    expect(normalizeHex('#ABCDEF')).toBe('#abcdef');
  });

  it('returns null for invalid input', () => {
    expect(normalizeHex('red')).toBeNull();
    expect(normalizeHex('#1234')).toBeNull();
    expect(normalizeHex('#ggffaa')).toBeNull();
    expect(normalizeHex(123)).toBeNull();
    expect(normalizeHex('')).toBeNull();
  });
});

describe('TABLE_COLORS', () => {
  it('is a 9x5 grid of 45 valid, normalized hex colours', () => {
    expect(TABLE_COLORS).toHaveLength(45);
    for (const c of TABLE_COLORS) expect(normalizeHex(c)).toBe(c);
  });
});
