// Select mode: when tools.mode === 'select', the pointer selects grid cells
// (empty or filled) by click, Ctrl/Cmd+click (toggle), or rubber-band drag.
// A drag that starts on an already-selected cell moves the selection. The
// selection can be recoloured (via the palette), deleted, or moved as a group.
import { cellKey } from './state.js';

const parseKey = (key) => {
  const comma = key.indexOf(',');
  return [Number(key.slice(0, comma)), Number(key.slice(comma + 1))];
};

/** Keys for every cell in the rectangle bounded by (ax,ay)–(bx,by), inclusive. */
export function rectKeys(ax, ay, bx, by) {
  const x0 = Math.min(ax, bx);
  const x1 = Math.max(ax, bx);
  const y0 = Math.min(ay, by);
  const y1 = Math.max(ay, by);
  const keys = [];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) keys.push(cellKey(x, y));
  }
  return keys;
}

export function createSelectionController({
  canvas,
  grid,
  cells,
  selection,
  tools,
  window: win,
  onChange,
}) {
  const w = win ?? (typeof window !== 'undefined' ? window : globalThis);
  const fire = onChange ?? (() => grid?.render?.());
  const metrics = grid.grid;
  let drag = null;

  function cellAt(ev) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((ev.clientX - rect.left) / metrics.cell.width);
    const y = Math.floor((ev.clientY - rect.top) / metrics.cell.height);
    if (x < 0 || y < 0 || x >= metrics.cols || y >= metrics.rows) return null;
    return { x, y };
  }

  function onDown(ev) {
    if (ev.button !== 0 || tools.mode !== 'select') return;
    const pos = cellAt(ev);
    if (!pos) return;
    const key = cellKey(pos.x, pos.y);

    if (ev.ctrlKey || ev.metaKey) {
      drag = { type: 'ctrl', anchor: pos, base: new Set(selection.keys), moved: false };
    } else if (selection.keys.has(key) && selection.keys.size > 0) {
      drag = { type: 'move', anchor: pos, moved: false };
      selection.offset = { x: 0, y: 0 };
    } else {
      drag = { type: 'rect', anchor: pos, moved: false };
      selection.keys = new Set([key]);
    }
    fire();
  }

  function onMove(ev) {
    if (!drag) return;
    const pos = cellAt(ev);
    if (!pos) return;
    if (pos.x !== drag.anchor.x || pos.y !== drag.anchor.y) drag.moved = true;

    if (drag.type === 'rect') {
      selection.keys = new Set(rectKeys(drag.anchor.x, drag.anchor.y, pos.x, pos.y));
    } else if (drag.type === 'ctrl') {
      const add = rectKeys(drag.anchor.x, drag.anchor.y, pos.x, pos.y);
      selection.keys = new Set([...drag.base, ...add]);
    } else if (drag.type === 'move') {
      selection.offset = { x: pos.x - drag.anchor.x, y: pos.y - drag.anchor.y };
    }
    fire();
  }

  function onUp() {
    if (!drag) return;
    if (drag.type === 'ctrl' && !drag.moved) {
      const key = cellKey(drag.anchor.x, drag.anchor.y);
      const next = new Set(drag.base);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      selection.keys = next;
    } else if (drag.type === 'move' && selection.offset) {
      moveBy(selection.offset.x, selection.offset.y);
      selection.offset = null;
    }
    drag = null;
    fire();
  }

  function moveBy(dx, dy) {
    if (!dx && !dy) return;
    const moved = [];
    selection.keys.forEach((key) => {
      const [x, y] = parseKey(key);
      moved.push({ x, y, cell: cells.get(x, y) });
    });
    for (const m of moved) cells.delete(m.x, m.y);
    const next = [];
    for (const m of moved) {
      const nx = m.x + dx;
      const ny = m.y + dy;
      if (nx < 0 || ny < 0 || nx >= metrics.cols || ny >= metrics.rows) continue;
      if (m.cell) cells.set(nx, ny, { ...m.cell });
      next.push(cellKey(nx, ny));
    }
    selection.keys = new Set(next);
  }

  function deleteSelected() {
    selection.keys.forEach((key) => {
      const [x, y] = parseKey(key);
      cells.delete(x, y);
    });
    fire();
  }

  function recolor(channel, color) {
    if (!selection.keys.size) return false;
    let changed = false;
    selection.keys.forEach((key) => {
      const [x, y] = parseKey(key);
      const cell = cells.get(x, y);
      if (cell) {
        cells.set(x, y, { ...cell, [channel]: color });
        changed = true;
      }
    });
    if (changed) fire();
    return changed;
  }

  function clear() {
    selection.keys = new Set();
    selection.offset = null;
    fire();
  }

  function onKey(ev) {
    if (tools.mode !== 'select' || !selection.keys.size) return;
    if (ev.key === 'Delete' || ev.key === 'Backspace') {
      ev.preventDefault();
      deleteSelected();
    } else if (ev.key === 'Escape') {
      clear();
    }
  }

  canvas.addEventListener('mousedown', onDown);
  w.addEventListener('mousemove', onMove);
  w.addEventListener('mouseup', onUp);
  w.addEventListener('keydown', onKey);

  return {
    moveBy,
    deleteSelected,
    recolor,
    clear,
    isDragging: () => !!drag,
    destroy() {
      canvas.removeEventListener('mousedown', onDown);
      w.removeEventListener('mousemove', onMove);
      w.removeEventListener('mouseup', onUp);
      w.removeEventListener('keydown', onKey);
    },
  };
}
