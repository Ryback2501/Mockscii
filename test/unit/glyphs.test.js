import { describe, it, expect } from 'vitest';
import { GLYPH_GROUPS, DEFAULT_GLYPH, allGlyphs, codePointLabel } from '../../src/glyphs.js';

describe('glyph groups', () => {
  it('exposes labelled, non-empty groups', () => {
    expect(GLYPH_GROUPS.length).toBeGreaterThan(0);
    for (const group of GLYPH_GROUPS) {
      expect(group.label).toBeTruthy();
      expect(group.chars.length).toBeGreaterThan(0);
    }
  });

  it('includes the full printable-ASCII range', () => {
    const ascii = GLYPH_GROUPS.find((g) => g.label === 'ASCII');
    expect(ascii.chars).toHaveLength(0x7e - 0x21 + 1);
    expect(ascii.chars[0]).toBe('!');
    expect(ascii.chars.at(-1)).toBe('~');
  });

  it('covers the categories modern terminal UIs rely on', () => {
    const labels = GLYPH_GROUPS.map((g) => g.label);
    for (const expected of [
      'Box drawing',
      'Block elements',
      'Geometric shapes',
      'Arrows',
      'Braille',
    ]) {
      expect(labels).toContain(expected);
    }
    // Spot-check representative glyphs are actually present.
    const all = allGlyphs();
    expect(all).toContain('╭'); // rounded box corner
    expect(all).toContain('▓'); // shade block
    expect(all).toContain('⠿'); // braille
    expect(all).toContain('◆'); // geometric diamond
  });
});

describe('allGlyphs', () => {
  it('is de-duplicated and preserves order', () => {
    const all = allGlyphs();
    expect(new Set(all).size).toBe(all.length);
    expect(all[0]).toBe('!');
  });

  it('contains the default glyph', () => {
    expect(allGlyphs()).toContain(DEFAULT_GLYPH);
  });
});

describe('codePointLabel', () => {
  it('formats a U+XXXX label', () => {
    expect(codePointLabel('A')).toBe('U+0041');
    expect(codePointLabel('█')).toBe('U+2588');
  });
});
