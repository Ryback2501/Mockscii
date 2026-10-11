// Top and left rulers framing the grid canvas. They tick every cell edge, label
// every 5th with its column/row index, and mark guide positions in teal. Each
// ruler matches the grid canvas's length along its axis, so the two stay
// aligned in both auto-fit and fixed-size modes.
import { GUIDE_COLOR } from './grid.js';

const RULER_BG = '#252526';
const TICK = 'rgba(212, 212, 212, 0.35)';
const LABEL = 'rgba(212, 212, 212, 0.7)';
const LABEL_EVERY = 5;

export function createRulers({ top, left, grid, guides, window: win }) {
  const w = win ?? (typeof window !== 'undefined' ? window : globalThis);
  const metrics = grid.grid;

  // Size a ruler canvas to its CSS box and return a ready context (or null).
  function prepare(canvas, cssW, cssH) {
    const ratio = w.devicePixelRatio || 1;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.width = Math.max(1, Math.round(cssW * ratio));
    canvas.height = Math.max(1, Math.round(cssH * ratio));
    const ctx = canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) return null;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = RULER_BG;
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.font = '10px system-ui, sans-serif';
    return ctx;
  }

  function renderTop() {
    const W = metrics.cell.width;
    const cssW = metrics.pxWidth;
    const cssH = top.clientHeight || 18;
    const ctx = prepare(top, cssW, cssH);
    if (!ctx) return;
    ctx.fillStyle = TICK;
    for (let c = 0; c <= metrics.cols; c++) {
      const len = c % LABEL_EVERY === 0 ? cssH : cssH / 4;
      ctx.fillRect(Math.round(c * W), cssH - len, 1, len);
    }
    ctx.fillStyle = LABEL;
    ctx.textBaseline = 'top';
    for (let c = 0; c < metrics.cols; c += LABEL_EVERY) ctx.fillText(String(c), c * W + 3, 2);
    if (guides.visible) {
      ctx.fillStyle = GUIDE_COLOR;
      for (const c of guides.v) ctx.fillRect(Math.round(c * W) - 1, 0, 3, cssH);
    }
  }

  function renderLeft() {
    const H = metrics.cell.height;
    const cssW = left.clientWidth || 32;
    const cssH = metrics.pxHeight;
    const ctx = prepare(left, cssW, cssH);
    if (!ctx) return;
    ctx.fillStyle = TICK;
    for (let r = 0; r <= metrics.rows; r++) {
      const len = r % LABEL_EVERY === 0 ? cssW : cssW / 4;
      ctx.fillRect(cssW - len, Math.round(r * H), len, 1);
    }
    ctx.fillStyle = LABEL;
    ctx.textBaseline = 'top';
    for (let r = 0; r < metrics.rows; r += LABEL_EVERY) ctx.fillText(String(r), 3, r * H + 3);
    if (guides.visible) {
      ctx.fillStyle = GUIDE_COLOR;
      for (const r of guides.h) ctx.fillRect(0, Math.round(r * H) - 1, cssW, 3);
    }
  }

  return {
    render() {
      if (top) renderTop();
      if (left) renderLeft();
    },
  };
}
