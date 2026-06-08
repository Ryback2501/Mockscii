// Glyph selector panel: a grouped grid of clickable glyphs plus a custom-character
// input. Single-select — clicking a glyph (or typing one) sets the active paint glyph.
import { GLYPH_GROUPS, DEFAULT_GLYPH, codePointLabel } from './glyphs.js';

export function createGlyphSelector(container, options = {}) {
  const doc = container.ownerDocument;
  const onSelect = options.onSelect ?? (() => {});
  let selected = options.initial ?? DEFAULT_GLYPH;
  const buttons = new Map(); // char -> button element

  function highlight(char) {
    for (const [ch, btn] of buttons) {
      const on = ch === char;
      btn.classList.toggle('selected', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  function select(char) {
    if (!char) return;
    selected = char;
    highlight(char);
    onSelect(char);
  }

  container.replaceChildren();

  for (const group of GLYPH_GROUPS) {
    const section = doc.createElement('div');
    section.className = 'glyph-group';

    // Foldable header: click to collapse/expand the group's grid.
    const title = doc.createElement('button');
    title.type = 'button';
    title.className = 'glyph-group-title';
    title.setAttribute('aria-expanded', 'true');
    const chevron = doc.createElement('span');
    chevron.className = 'glyph-group-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '▾';
    const label = doc.createElement('span');
    label.className = 'glyph-group-label';
    label.textContent = group.label;
    title.append(chevron, label);
    title.addEventListener('click', () => {
      const collapsed = section.classList.toggle('collapsed');
      title.setAttribute('aria-expanded', String(!collapsed));
    });
    section.appendChild(title);

    const grid = doc.createElement('div');
    grid.className = 'glyph-grid';
    for (const ch of group.chars) {
      if (buttons.has(ch)) continue; // a glyph shown once, in its first group
      const btn = doc.createElement('button');
      btn.type = 'button';
      btn.className = 'glyph';
      btn.textContent = ch;
      btn.title = codePointLabel(ch);
      btn.addEventListener('click', () => select(ch));
      buttons.set(ch, btn);
      grid.appendChild(btn);
    }
    section.appendChild(grid);
    container.appendChild(section);
  }

  const custom = doc.createElement('div');
  custom.className = 'glyph-custom';
  const input = doc.createElement('input');
  input.type = 'text';
  input.maxLength = 2; // room for a surrogate pair; we take the first code point
  input.placeholder = 'Type a glyph…';
  input.setAttribute('aria-label', 'Custom glyph');
  input.addEventListener('input', () => {
    const ch = [...input.value][0];
    if (ch) select(ch);
  });
  custom.appendChild(input);
  container.appendChild(custom);

  highlight(selected);

  return {
    element: container,
    getSelected: () => selected,
    setSelected: select,
  };
}
