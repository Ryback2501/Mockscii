// Photoshop-style guides: full-height vertical and full-width horizontal lines
// drawn above everything in teal, snapped to cell edges. Guides are created by
// dragging out of a ruler onto the canvas (top ruler -> horizontal, left ruler
// -> vertical). Each guide has a marker on the ruler along its axis (vertical
// guides on the top ruler, horizontal on the left); hovering a marker shows a
// move cursor and dragging it moves the guide. Dragging a marker past the end of
// its ruler deletes the guide. Ctrl/Cmd+; toggles visibility.
//
// `guides` is shared with the grid renderer: { v, h, visible, preview } where
// v/h hold cell-edge indices (a vertical guide at c sits on the left edge of
// column c) and preview is the in-flight drag ({ axis, index, pos, inside }).

export function createGuides() {
  return { v: [], h: [], visible: true, preview: null };
}

const GRAB_PX = 4; // hit distance from a guide marker on a ruler, in CSS pixels

export function createGuidesController({
  canvas,
  topRuler,
  leftRuler,
  grid,
  guides,
  window: win,
  onChange,
}) {
  const w = win ?? (typeof window !== 'undefined' ? window : globalThis);
  const fire = onChange ?? (() => grid.render());
  const metrics = grid.grid;
  let drag = null; // { axis: 'v' | 'h', index } — index -1 for a new guide

  // Nearest cell edge to the pointer along the drag axis, and whether the drop
  // keeps the guide. A new guide must be dropped on the canvas; a moved guide
  // is kept while the pointer is within the canvas span along its axis (so it
  // can slide along its ruler) and deleted when dragged past either end.
  function edgeAt(ev, axis, index) {
    const rect = canvas.getBoundingClientRect();
    const inX = ev.clientX >= rect.left && ev.clientX < rect.right;
    const inY = ev.clientY >= rect.top && ev.clientY < rect.bottom;
    const inside = index === -1 ? inX && inY : axis === 'v' ? inX : inY;
    const pos =
      axis === 'v'
        ? Math.round((ev.clientX - rect.left) / metrics.cell.width)
        : Math.round((ev.clientY - rect.top) / metrics.cell.height);
    const max = axis === 'v' ? metrics.cols : metrics.rows;
    return { pos: Math.max(0, Math.min(max, pos)), inside };
  }

  function begin(axis, index, ev) {
    ev.preventDefault();
    ev.stopPropagation();
    guides.visible = true;
    drag = { axis, index };
    update(ev);
  }

  function update(ev) {
    const { pos, inside } = edgeAt(ev, drag.axis, drag.index);
    guides.preview = { axis: drag.axis, index: drag.index, pos, inside };
    fire();
  }

  // Index of the guide whose ruler marker is under the pointer, or -1. The top
  // ruler carries vertical guides' markers; the left ruler horizontal ones.
  function markerAt(ev, axis) {
    if (!guides.visible) return -1;
    const rect = canvas.getBoundingClientRect();
    const offset = axis === 'v' ? ev.clientX - rect.left : ev.clientY - rect.top;
    const size = axis === 'v' ? metrics.cell.width : metrics.cell.height;
    return guides[axis].findIndex((e) => Math.abs(e * size - offset) <= GRAB_PX);
  }

  // Pressing a ruler grabs the guide marker under the pointer, or else pulls
  // out a new guide (top ruler -> horizontal, left ruler -> vertical).
  function onRulerDown(ev, markerAxis, newAxis) {
    if (ev.button !== 0) return;
    const index = markerAt(ev, markerAxis);
    if (index !== -1) begin(markerAxis, index, ev);
    else begin(newAxis, -1, ev);
  }

  // Hovering a guide marker shows a move cursor.
  function onRulerHover(ev, ruler, markerAxis) {
    if (drag) return;
    const over = markerAt(ev, markerAxis) !== -1;
    ruler.style.cursor = over ? (markerAxis === 'v' ? 'ew-resize' : 'ns-resize') : '';
  }

  function onMove(ev) {
    if (drag) update(ev);
  }

  function onUp() {
    if (!drag) return;
    const { axis, index } = drag;
    const p = guides.preview;
    const list = guides[axis];
    if (index !== -1) list.splice(index, 1);
    if (p?.inside && !list.includes(p.pos)) list.push(p.pos);
    list.sort((a, b) => a - b);
    drag = null;
    guides.preview = null;
    fire();
  }

  function toggle(force) {
    guides.visible = typeof force === 'boolean' ? force : !guides.visible;
    fire();
  }

  function onKey(ev) {
    if ((ev.ctrlKey || ev.metaKey) && ev.key === ';') {
      ev.preventDefault();
      toggle();
    }
  }

  const onTopDown = (ev) => onRulerDown(ev, 'v', 'h');
  const onLeftDown = (ev) => onRulerDown(ev, 'h', 'v');
  const onTopHover = (ev) => onRulerHover(ev, topRuler, 'v');
  const onLeftHover = (ev) => onRulerHover(ev, leftRuler, 'h');

  topRuler?.addEventListener('mousedown', onTopDown);
  leftRuler?.addEventListener('mousedown', onLeftDown);
  topRuler?.addEventListener('mousemove', onTopHover);
  leftRuler?.addEventListener('mousemove', onLeftHover);
  w.addEventListener('mousemove', onMove);
  w.addEventListener('mouseup', onUp);
  w.addEventListener('keydown', onKey);

  return {
    toggle,
    isDragging: () => !!drag,
    // Replace all guides (e.g. from an imported file).
    set({ v = [], h = [] } = {}) {
      guides.v = [...v].sort((a, b) => a - b);
      guides.h = [...h].sort((a, b) => a - b);
      fire();
    },
    destroy() {
      topRuler?.removeEventListener('mousedown', onTopDown);
      leftRuler?.removeEventListener('mousedown', onLeftDown);
      topRuler?.removeEventListener('mousemove', onTopHover);
      leftRuler?.removeEventListener('mousemove', onLeftHover);
      w.removeEventListener('mousemove', onMove);
      w.removeEventListener('mouseup', onUp);
      w.removeEventListener('keydown', onKey);
    },
  };
}
