// Type-on-grid: when the `text` tool is active, clicking the canvas drops a text
// caret at a cell. Typing fills cells with the active glyph/colours and advances
// the caret; Enter returns to the start column on the next row; Backspace clears
// the cell to the left; arrows move the caret; Escape (or leaving the tool)
// exits. A typed run commits one undo checkpoint at each line/exit boundary.

export function createTextCursorController({ canvas, grid, cells, tools, window: win, history }) {
  const w = win ?? (typeof window !== 'undefined' ? window : globalThis);
  const metrics = grid.grid; // live { cols, rows, cell }
  let cursor = null; // { x, y, startCol }
  let dirty = false; // typed since the last commit

  const draw = () => grid.setCursor(cursor); // re-renders cells + caret

  function commit() {
    if (dirty) {
      history?.commit();
      dirty = false;
    }
  }

  function clampX(x) {
    return Math.max(0, Math.min(metrics.cols - 1, x));
  }
  function clampY(y) {
    return Math.max(0, Math.min(metrics.rows - 1, y));
  }

  function cellAt(ev) {
    const rect = canvas.getBoundingClientRect();
    const col = Math.floor((ev.clientX - rect.left) / metrics.cell.width);
    const row = Math.floor((ev.clientY - rect.top) / metrics.cell.height);
    if (col < 0 || row < 0 || col >= metrics.cols || row >= metrics.rows) return null;
    return { col, row };
  }

  function place(x, y) {
    commit(); // finish any previous run before moving the caret
    cursor = { x: clampX(x), y: clampY(y), startCol: clampX(x) };
    draw();
  }

  function deactivate() {
    if (!cursor) return;
    commit();
    cursor = null;
    grid.setCursor(null);
  }

  function onDown(ev) {
    if (ev.button !== 0 || tools.tool !== 'text') return;
    const pos = cellAt(ev);
    if (!pos) return;
    place(pos.col, pos.row);
  }

  function typeChar(ch) {
    cells.set(cursor.x, cursor.y, { ch, fg: tools.fg ?? null, bg: tools.bg ?? null });
    dirty = true;
    if (cursor.x + 1 < metrics.cols) {
      cursor.x += 1;
    } else if (cursor.y + 1 < metrics.rows) {
      cursor.x = cursor.startCol;
      cursor.y += 1;
    }
  }

  function onKey(ev) {
    if (tools.tool !== 'text' || !cursor) return;
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return; // leave shortcuts alone
    const el = w.document && w.document.activeElement;
    const tag = el && el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    const k = ev.key;
    if (k === 'Escape') {
      ev.preventDefault();
      deactivate();
    } else if (k === 'Enter') {
      ev.preventDefault();
      commit();
      cursor.x = cursor.startCol;
      cursor.y = clampY(cursor.y + 1);
      draw();
    } else if (k === 'Backspace') {
      ev.preventDefault();
      cursor.x = clampX(cursor.x - 1);
      if (cells.delete(cursor.x, cursor.y)) dirty = true;
      draw();
    } else if (k === 'ArrowLeft') {
      ev.preventDefault();
      cursor.x = clampX(cursor.x - 1);
      draw();
    } else if (k === 'ArrowRight') {
      ev.preventDefault();
      cursor.x = clampX(cursor.x + 1);
      draw();
    } else if (k === 'ArrowUp') {
      ev.preventDefault();
      cursor.y = clampY(cursor.y - 1);
      draw();
    } else if (k === 'ArrowDown') {
      ev.preventDefault();
      cursor.y = clampY(cursor.y + 1);
      draw();
    } else if (k.length === 1) {
      ev.preventDefault();
      typeChar(k);
      draw();
    }
  }

  canvas.addEventListener('mousedown', onDown);
  w.addEventListener('keydown', onKey);

  return {
    deactivate,
    getCursor: () => cursor,
    destroy() {
      canvas.removeEventListener('mousedown', onDown);
      w.removeEventListener('keydown', onKey);
    },
  };
}
