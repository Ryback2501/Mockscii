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
