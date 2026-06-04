import { describe, it, expect } from 'vitest';
import { FONT_OPTIONS, DEFAULT_FONT } from '../../src/fonts.js';

describe('font options', () => {
  it('offers several labelled fonts', () => {
    expect(FONT_OPTIONS.length).toBeGreaterThanOrEqual(8);
    for (const f of FONT_OPTIONS) {
      expect(f.label).toBeTruthy();
      expect(f.value).toBeTruthy();
    }
  });

  it('every stack falls back to monospace', () => {
    for (const f of FONT_OPTIONS) {
      expect(f.value.endsWith('monospace')).toBe(true);
    }
  });

  it('covers Windows, macOS and Linux fonts', () => {
    const labels = FONT_OPTIONS.map((f) => f.label).join(' ');
    expect(labels).toMatch(/Windows/);
    expect(labels).toMatch(/macOS/);
    expect(labels).toMatch(/Linux/);
  });

  it('defaults to the first option', () => {
    expect(DEFAULT_FONT).toBe(FONT_OPTIONS[0].value);
    expect(DEFAULT_FONT).toBe('monospace');
  });
});
