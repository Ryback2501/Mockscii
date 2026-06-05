// Export / Import: the mockup is persisted manually as a JSON document. The
// saved file captures the sparse painted cells, the chosen font, and the
// palette. Cells reference palette colours by their stable id, so the palette
// is saved as { id, color } entries and the cell fg/bg ids stay valid across a
// round-trip. Grid cols/rows are viewport-derived (auto-fit) and are NOT saved;
// cells are stored at absolute coordinates.

export const SCHEMA_VERSION = 1;

/** Build the plain-object document for the current editor state. */
export function serialize({ font, palette, cells }) {
  const cellList = [];
  cells.forEach((x, y, cell) => {
    cellList.push({ x, y, ch: cell.ch, fg: cell.fg ?? null, bg: cell.bg ?? null });
  });
  const entries = Array.isArray(palette) ? palette.map((e) => ({ id: e.id, color: e.color })) : [];
  return {
    version: SCHEMA_VERSION,
    font: typeof font === 'string' ? font : null,
    palette: entries,
    cells: cellList,
  };
}

/** Validate and normalise a parsed document into { font, palette, cells }. */
export function deserialize(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid Mockscii document');
  }

  const font = typeof data.font === 'string' ? data.font : null;

  const palette =
    Array.isArray(data.palette) &&
    data.palette.every((e) => e && Number.isInteger(e.id) && typeof e.color === 'string')
      ? data.palette.map((e) => ({ id: e.id, color: e.color }))
      : null;

  const cells = Array.isArray(data.cells)
    ? data.cells.filter(
        (c) =>
          c &&
          Number.isInteger(c.x) &&
          Number.isInteger(c.y) &&
          typeof c.ch === 'string' &&
          c.ch !== '',
      )
    : [];

  return { font, palette, cells };
}

/** Replace the store's contents with the given cell list. */
export function applyToCells(cells, list) {
  cells.clear();
  for (const c of list) {
    cells.set(c.x, c.y, { ch: c.ch, fg: c.fg ?? null, bg: c.bg ?? null });
  }
}

/** Trigger a browser download of `obj` as pretty-printed JSON. */
export function downloadJSON(obj, filename, doc = document) {
  const url = doc.defaultView ?? (typeof window !== 'undefined' ? window : null);
  const URLClass = url?.URL ?? (typeof URL !== 'undefined' ? URL : null);
  if (!URLClass || typeof URLClass.createObjectURL !== 'function') return; // no-op when unavailable
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const href = URLClass.createObjectURL(blob);
  const a = doc.createElement('a');
  a.href = href;
  a.download = filename;
  doc.body.appendChild(a);
  a.click();
  a.remove();
  URLClass.revokeObjectURL(href);
}

/** Read a File/Blob as text via FileReader. */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Read failed'));
    reader.readAsText(file);
  });
}
