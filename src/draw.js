// Draw mode: click and drag on the canvas to paint the active glyph (with the
// current fg/bg from `tools`) into the sparse cell store, redrawing as it goes.

const DEFAULT_FG = '#d4d4d4';

export function createDrawController({ canvas, grid, cells, tools, window: win }) {
  const w = win ?? (typeof window !== 'undefined' ? window : globalThis);
  const metrics = grid.grid; // live { cols, rows, cell }
  let painting = false;

  function cellAt(ev) {
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const col = Math.floor(x / metrics.cell.width);
    const row = Math.floor(y / metrics.cell.height);
    if (col < 0 || row < 0 || col >= metrics.cols || row >= metrics.rows) return null;
    return { col, row };
  }

  function paintCell(col, row) {
    const ch = tools.glyph;
    if (ch == null || ch === '') return;
    cells.set(col, row, { ch, fg: tools.fg ?? DEFAULT_FG, bg: tools.bg ?? null });
    grid.render();
  }

  function paint(ev) {
    const pos = cellAt(ev);
    if (pos) paintCell(pos.col, pos.row);
  }

  function onDown(ev) {
    if (ev.button !== 0) return;
    painting = true;
    paint(ev);
  }
  function onMove(ev) {
    if (painting) paint(ev);
  }
  function onUp() {
    painting = false;
  }

  canvas.addEventListener('mousedown', onDown);
  w.addEventListener('mousemove', onMove);
  w.addEventListener('mouseup', onUp);

  return {
    paintCell, // programmatic painting (col, row)
    isPainting: () => painting,
    destroy() {
      canvas.removeEventListener('mousedown', onDown);
      w.removeEventListener('mousemove', onMove);
      w.removeEventListener('mouseup', onUp);
    },
  };
}
