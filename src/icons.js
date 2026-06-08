// Shared inline-SVG icons (stroke = currentColor, so they inherit button colour)
// and a small button factory. Grows as new tools land.

const svg = (paths, { fill = false } = {}) =>
  `<svg viewBox="0 0 24 24" width="18" height="18" fill="${fill ? 'currentColor' : 'none'}" ` +
  `stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ` +
  `aria-hidden="true">${paths}</svg>`;

export const ICONS = {
  export: svg('<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/>'),
  import: svg('<path d="M12 15V3"/><path d="M7 8l5-5 5 5"/><path d="M5 21h14"/>'),
  plus: svg('<path d="M12 5v14"/><path d="M5 12h14"/>'),
  pencil: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  trash: svg(
    '<path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/>' +
      '<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>' +
      '<path d="M10 11v6"/><path d="M14 11v6"/>',
  ),
  undo: svg('<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-1"/>'),
  redo: svg('<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h1"/>'),
  clear: svg(
    '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9l6 6"/><path d="M15 9l-6 6"/>',
  ),
  eraser: svg('<path d="M16 3l5 5L10 19H5l-3-3z"/><path d="M9 10l5 5"/><path d="M5 19h14"/>'),
  line: svg('<path d="M5 19L19 5"/>'),
  rect: svg('<rect x="4" y="6" width="16" height="12" rx="1"/>'),
  bucket: svg(
    '<path d="M5 11l7-7 7 7-7 7a2 2 0 0 1-3 0l-4-4a2 2 0 0 1 0-3z"/>' +
      '<path d="M8 8l8 8"/><path d="M20 16s2 2 2 3a2 2 0 0 1-4 0c0-1 2-3 2-3z"/>',
  ),
};

/** Create a `<button>` whose content is an inline-SVG icon, with an a11y label. */
export function iconButton(doc, cls, icon, title) {
  const b = doc.createElement('button');
  b.type = 'button';
  b.className = cls;
  b.title = title;
  b.setAttribute('aria-label', title);
  b.innerHTML = icon;
  return b;
}
