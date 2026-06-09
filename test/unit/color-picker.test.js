import { describe, it, expect } from 'vitest';
import {
  normalizeHex,
  TABLE_COLORS,
  hsvToHex,
  hexToHsv,
  svFromPoint,
  hueFromPoint,
} from '../../src/color-picker.js';

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

describe('hsv <-> hex', () => {
  it('converts known colours to hex', () => {
    expect(hsvToHex(0, 1, 1)).toBe('#ff0000'); // red
    expect(hsvToHex(120, 1, 1)).toBe('#00ff00'); // green
    expect(hsvToHex(240, 1, 1)).toBe('#0000ff'); // blue
    expect(hsvToHex(0, 0, 1)).toBe('#ffffff'); // white
    expect(hsvToHex(0, 0, 0)).toBe('#000000'); // black
  });

  it('round-trips hex -> hsv -> hex', () => {
    for (const hex of ['#bf4040', '#1e90ff', '#7f7f7f', '#102030']) {
      const { h, s, v } = hexToHsv(hex);
      expect(hsvToHex(h, s, v)).toBe(hex);
    }
  });

  it('hexToHsv returns null for invalid input', () => {
    expect(hexToHsv('nope')).toBeNull();
  });
});

describe('drag position helpers', () => {
  const rect = { left: 10, top: 20, width: 200, height: 100 };

  it('maps S/V square corners to saturation/value', () => {
    expect(svFromPoint(10, 20, rect)).toEqual({ s: 0, v: 1 }); // top-left
    expect(svFromPoint(210, 120, rect)).toEqual({ s: 1, v: 0 }); // bottom-right
    expect(svFromPoint(110, 70, rect)).toEqual({ s: 0.5, v: 0.5 }); // centre
    // Clamped outside the rect.
    expect(svFromPoint(-100, 1000, rect)).toEqual({ s: 0, v: 0 });
  });

  it('maps hue-slider position to 0..360', () => {
    expect(hueFromPoint(20, rect)).toBe(0); // top
    expect(hueFromPoint(120, rect)).toBe(360); // bottom
    expect(hueFromPoint(70, rect)).toBe(180); // middle
  });
});
