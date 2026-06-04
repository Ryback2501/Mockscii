import { describe, it, expect } from 'vitest';
import { normalizeHex } from '../../src/color-picker.js';

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
