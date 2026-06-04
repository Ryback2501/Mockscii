import { describe, it, expect, beforeEach } from 'vitest';
import { createGlyphSelector } from '../../src/glyph-selector.js';
import { allGlyphs, DEFAULT_GLYPH } from '../../src/glyphs.js';

describe('glyph selector', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = '<section id="glyph-selector"></section>';
    container = document.getElementById('glyph-selector');
  });

  it('renders a button for every glyph and highlights the default', () => {
    const sel = createGlyphSelector(container);
    const buttons = container.querySelectorAll('button.glyph');
    expect(buttons).toHaveLength(allGlyphs().length);
    expect(sel.getSelected()).toBe(DEFAULT_GLYPH);

    const active = container.querySelectorAll('button.glyph.selected');
    expect(active).toHaveLength(1);
    expect(active[0].textContent).toBe(DEFAULT_GLYPH);
  });

  it('selects a glyph on click and notifies via onSelect', () => {
    const picked = [];
    const sel = createGlyphSelector(container, { onSelect: (ch) => picked.push(ch) });

    const target = [...container.querySelectorAll('button.glyph')].find(
      (b) => b.textContent === '@',
    );
    target.click();

    expect(sel.getSelected()).toBe('@');
    expect(picked).toEqual(['@']);
    expect(target.classList.contains('selected')).toBe(true);
    expect(container.querySelectorAll('button.glyph.selected')).toHaveLength(1);
  });

  it('accepts a custom typed glyph (first code point)', () => {
    const sel = createGlyphSelector(container);
    const input = container.querySelector('.glyph-custom input');

    input.value = '§';
    input.dispatchEvent(new window.Event('input'));

    expect(sel.getSelected()).toBe('§');
    // A custom glyph that is not in the grid clears the grid highlight.
    expect(container.querySelectorAll('button.glyph.selected')).toHaveLength(0);
  });

  it('respects an initial selection', () => {
    const sel = createGlyphSelector(container, { initial: 'A' });
    expect(sel.getSelected()).toBe('A');
    const active = container.querySelector('button.glyph.selected');
    expect(active.textContent).toBe('A');
  });
});
