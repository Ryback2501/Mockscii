// Canvas-backed character grid: auto-fits its container, derives cols/rows from
// the available pixel area divided by the cell size, and redraws crisply on resize.
import { DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE, cellSize, gridDimensions } from './state.js';

const BG_COLOR = '#1e1e1e';
const GRID_LINE = 'rgba(255, 255, 255, 0.05)';

/**
 * Create a grid controller bound to a <canvas>.
 * Returns { grid, resize, render } where `grid` holds the live { cols, rows, cell }.
 */
export function createGrid(canvas, options = {}) {
  const win = options.window ?? (typeof window !== 'undefined' ? window : globalThis);
  const fontFamily = options.fontFamily ?? DEFAULT_FONT_FAMILY;
  const fontSize = options.fontSize ?? DEFAULT_FONT_SIZE;
  const ctx = canvas.getContext ? canvas.getContext('2d') : null;

  const grid = {
    cols: 0,
    rows: 0,
    cell: { width: 0, height: 0 },
    fontFamily,
    fontSize,
  };

  const dpr = () => win.devicePixelRatio || 1;

  function measureCell() {
    let advance = fontSize * 0.6; // fallback when no 2d context is available
    if (ctx) {
      ctx.font = `${fontSize}px ${fontFamily}`;
      advance = ctx.measureText('M').width || advance;
    }
    grid.cell = cellSize(fontSize, advance);
  }

  function render() {
    if (!ctx) return;
    const ratio = dpr();
    const w = canvas.width / ratio;
    const h = canvas.height / ratio;

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = GRID_LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const right = grid.cols * grid.cell.width;
    const bottom = grid.rows * grid.cell.height;
    for (let c = 0; c <= grid.cols; c++) {
      const x = Math.round(c * grid.cell.width) + 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, bottom);
    }
    for (let r = 0; r <= grid.rows; r++) {
      const y = Math.round(r * grid.cell.height) + 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(right, y);
    }
    ctx.stroke();
  }

  function resize() {
    const ratio = dpr();
    const cssW = canvas.clientWidth || canvas.parentElement?.clientWidth || 0;
    const cssH = canvas.clientHeight || canvas.parentElement?.clientHeight || 0;

    canvas.width = Math.max(1, Math.round(cssW * ratio));
    canvas.height = Math.max(1, Math.round(cssH * ratio));
    if (ctx) ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    measureCell();
    const dims = gridDimensions(cssW, cssH, grid.cell);
    grid.cols = dims.cols;
    grid.rows = dims.rows;

    render();
    return grid;
  }

  return { grid, resize, render, measureCell };
}
