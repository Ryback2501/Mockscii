// Hover info for painted cells: resting the pointer on a cell that holds a glyph
// shows a small tooltip with the glyph, its Unicode name and code point — the
// same description the glyph selector uses. Hidden while a button is held so it
// never gets in the way of drawing.
import { describeGlyph } from './glyphs.js';

const DELAY_MS = 350;

export function createCellInfo({ canvas, grid, cells, window: win }) {
  const w = win ?? (typeof window !== 'undefined' ? window : globalThis);
  const doc = canvas.ownerDocument;
  const metrics = grid.grid;

  const tip = doc.createElement('div');
  tip.className = 'cell-tooltip';
  tip.setAttribute('role', 'tooltip');
  tip.hidden = true;
  const glyph = doc.createElement('span');
  glyph.className = 'cell-tooltip-glyph';
  const text = doc.createElement('span');
  tip.append(glyph, text);
  doc.body.appendChild(tip);

  let timer = null;
  let shownKey = null;

  function hide() {
    if (timer) w.clearTimeout(timer);
    timer = null;
    shownKey = null;
    tip.hidden = true;
  }

  function onMove(ev) {
    if (ev.buttons) return hide();
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((ev.clientX - rect.left) / metrics.cell.width);
    const y = Math.floor((ev.clientY - rect.top) / metrics.cell.height);
    const ch =
      x >= 0 && y >= 0 && x < metrics.cols && y < metrics.rows ? cells.get(x, y)?.ch : null;
    if (!ch || !ch.trim()) return hide();

    const key = `${x},${y}`;
    if (key === shownKey) return; // already showing this cell; don't chase the pointer
    hide();
    const { clientX, clientY } = ev;
    timer = w.setTimeout(() => {
      glyph.textContent = ch;
      text.textContent = describeGlyph(ch);
      tip.hidden = false;
      // Below-right of the pointer, flipped to stay inside the viewport.
      const { offsetWidth: tw, offsetHeight: th } = tip;
      let left = clientX + 14;
      let top = clientY + 18;
      if (left + tw > w.innerWidth - 4) left = clientX - tw - 10;
      if (top + th > w.innerHeight - 4) top = clientY - th - 10;
      tip.style.left = `${Math.max(4, left)}px`;
      tip.style.top = `${Math.max(4, top)}px`;
      shownKey = key;
      timer = null;
    }, DELAY_MS);
  }

  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseleave', hide);
  canvas.addEventListener('mousedown', hide);

  return {
    element: tip,
    hide,
    destroy() {
      hide();
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', hide);
      canvas.removeEventListener('mousedown', hide);
      tip.remove();
    },
  };
}
