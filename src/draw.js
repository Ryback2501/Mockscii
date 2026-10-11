// Pointer paint controller. Handles the click/drag tools selected via
// `tools.tool`: draw (paint the active glyph), erase (delete cells), recolor
// (repaint the active colour channel of painted cells, keeping their glyph), fill
// (flood-fill the contiguous region), and the shape tools line + rect (drag to
// preview, release to stamp). Each gesture commits one undo checkpoint. Select /
// text are handled by their own controllers.
import { floodFill } from './fill.js';
import { linePoints, rectOutline } from './shapes.js';

const PAINT_TOOLS = new Set(['draw', 'erase', 'recolor', 'fill']);
const SHAPE_TOOLS = new Set(['line', 'rect']);

export function createDrawController({ canvas, grid, cells, tools, window: win, history }) {
  const w = win ?? (typeof window !== 'undefined' ? window : globalThis);
  const metrics = grid.grid; // live { cols, rows, cell }
  let painting = false;
  let dirty = false; // whether the current gesture changed anything
  let anchor = null; // shape-tool start cell while dragging
  let shapeEnd = null; // last valid shape-tool end cell

  function cellAt(ev) {
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const col = Math.floor(x / metrics.cell.width);
    const row = Math.floor(y / metrics.cell.height);
    if (col < 0 || row < 0 || col >= metrics.cols || row >= metrics.rows) return null;
    return { col, row };
  }

  // Apply the active tool at one cell. Returns nothing; sets `dirty` + renders.
  function applyCell(col, row) {
    const tool = tools.tool ?? 'draw';
    if (tool === 'erase') {
      if (cells.delete(col, row)) dirty = true;
    } else if (tool === 'recolor') {
      const cell = cells.get(col, row);
      if (!cell) return;
      const channel = tools.activeChannel === 'bg' ? 'bg' : 'fg';
      const color = tools[channel] ?? null;
      if (cell[channel] === color) return;
      cells.set(col, row, { ...cell, [channel]: color });
      dirty = true;
    } else if (tool === 'fill') {
      const ch = tools.glyph;
      if (ch == null || ch === '') return;
      const paint = { ch, fg: tools.fg ?? null, bg: tools.bg ?? null };
      if (floodFill(cells, col, row, metrics.cols, metrics.rows, paint)) dirty = true;
    } else {
      const ch = tools.glyph;
      if (ch == null || ch === '') return;
      cells.set(col, row, { ch, fg: tools.fg ?? null, bg: tools.bg ?? null });
      dirty = true;
    }
    grid.render();
  }

  // Shape tools: the cell coordinates the active shape covers between two points.
  function shapePoints(a, b) {
    const pts =
      tools.tool === 'line'
        ? linePoints(a.col, a.row, b.col, b.row)
        : rectOutline(a.col, a.row, b.col, b.row);
    return pts.filter(([x, y]) => x >= 0 && y >= 0 && x < metrics.cols && y < metrics.rows);
  }

  function shapeCell() {
    const ch = tools.glyph;
    if (ch == null || ch === '') return null;
    return { ch, fg: tools.fg ?? null, bg: tools.bg ?? null };
  }

  function previewShape() {
    const cell = shapeCell();
    if (!cell || !anchor || !shapeEnd) {
      grid.setPreview(null);
      return;
    }
    // Width x height of the shape's bounding box, in cells (inclusive).
    const width = Math.abs(shapeEnd.col - anchor.col) + 1;
    const height = Math.abs(shapeEnd.row - anchor.row) + 1;
    grid.setPreview(
      shapePoints(anchor, shapeEnd).map(([x, y]) => ({ x, y, cell })),
      { text: `${width}×${height}`, x: shapeEnd.col, y: shapeEnd.row },
    );
  }

  function onDown(ev) {
    if (ev.button !== 0) return;
    const tool = tools.tool ?? 'draw';

    if (SHAPE_TOOLS.has(tool)) {
      const pos = cellAt(ev);
      if (!pos) return;
      anchor = pos;
      shapeEnd = pos;
      previewShape();
      return;
    }

    if (!PAINT_TOOLS.has(tool)) return; // not a pointer tool
    const pos = cellAt(ev);
    if (!pos) return;
    dirty = false;

    if (tool === 'fill') {
      applyCell(pos.col, pos.row); // single-shot flood, no drag
      if (dirty) history?.commit();
      return;
    }
    painting = true;
    applyCell(pos.col, pos.row);
  }

  function onMove(ev) {
    if (anchor) {
      const pos = cellAt(ev);
      if (pos) {
        shapeEnd = pos;
        previewShape();
      }
      return;
    }
    if (!painting) return;
    const pos = cellAt(ev);
    if (pos) applyCell(pos.col, pos.row);
  }

  function onUp() {
    if (anchor) {
      const cell = shapeCell();
      if (cell && shapeEnd) {
        for (const [x, y] of shapePoints(anchor, shapeEnd)) cells.set(x, y, { ...cell });
        history?.commit();
      }
      anchor = null;
      shapeEnd = null;
      grid.setPreview(null); // also re-renders with the committed cells
      return;
    }
    if (painting && dirty) history?.commit(); // one undo step per stroke
    painting = false;
    dirty = false;
  }

  canvas.addEventListener('mousedown', onDown);
  w.addEventListener('mousemove', onMove);
  w.addEventListener('mouseup', onUp);

  return {
    // Programmatic painting with the active tool (col, row).
    paintCell: (col, row) => {
      dirty = false;
      applyCell(col, row);
      if (dirty) history?.commit();
    },
    isPainting: () => painting,
    destroy() {
      canvas.removeEventListener('mousedown', onDown);
      w.removeEventListener('mousemove', onMove);
      w.removeEventListener('mouseup', onUp);
    },
  };
}
