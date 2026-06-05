import { describe, it, expect } from 'vitest';
import {
  FONT_CATALOG,
  getAvailableFonts,
  DEFAULT_FONT,
  WEB_FONT_FAMILIES,
} from '../../src/fonts.js';

describe('font catalog', () => {
  it('has generic, web and system entries with a family and monospace fallback', () => {
    const types = new Set(FONT_CATALOG.map((f) => f.type));
    expect(types).toEqual(new Set(['generic', 'web', 'system']));
    for (const f of FONT_CATALOG) {
      expect(f.label).toBeTruthy();
      expect(f.family).toBeTruthy();
      expect(f.value.endsWith('monospace')).toBe(true);
    }
  });

  it('exposes the web families and defaults to generic monospace', () => {
    expect(WEB_FONT_FAMILIES.length).toBeGreaterThanOrEqual(5);
    expect(WEB_FONT_FAMILIES).toContain('JetBrains Mono');
    expect(DEFAULT_FONT).toBe('monospace');
  });
});

describe('getAvailableFonts', () => {
  it('always keeps generic + web, drops system when unavailable', () => {
    const list = getAvailableFonts({ isAvailable: () => false });
    expect(list.some((f) => f.type === 'generic')).toBe(true);
    expect(list.some((f) => f.type === 'web')).toBe(true);
    expect(list.some((f) => f.type === 'system')).toBe(false);
  });

  it('keeps system fonts when available', () => {
    const list = getAvailableFonts({ isAvailable: () => true });
    expect(list.length).toBe(FONT_CATALOG.length);
    expect(list.some((f) => f.type === 'system')).toBe(true);
  });

  it('only shows the installed system fonts', () => {
    const list = getAvailableFonts({ isAvailable: (family) => family === 'Consolas' });
    const system = list.filter((f) => f.type === 'system').map((f) => f.family);
    expect(system).toEqual(['Consolas']);
  });
});
