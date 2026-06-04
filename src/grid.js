// Canvas-backed character grid: auto-fits its container, derives cols/rows from
// the available pixel area divided by the cell size, and redraws crisply on
// resize. Cells are sized to the font's real metrics; each glyph is scaled to
// fill its cell exactly (so block/box glyphs tile seamlessly and every cell's
// background covers the whole cell) and drawn on a shared baseline.
import { DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE, cellDimensions, gridDimensions } from './state.js';

const BG_COLOR = '#1e1e1e';
const DEFAULT_FG = '#d4d4d4';

export function createGrid(canvas, options = {}) {
  const win = options.window ?? (typeof window !== 'undefined' ? window : globalThis);
  let fontFamily = options.fontFamily ?? DEFAULT_FONT_FAMILY;
  const fontSize = options.fontSize ?? DEFAULT_FONT_SIZE;
  const cells = options.cells ?? { forEach() {} };
  const ctx = canvas.getContext ? canvas.getContext('2d') : null;

  const grid = {
    cols: 0,
    rows: 0,
    cell: { width: 0, height: 0 },
    fontFamily,
    fontSize,
  };

  // Raw (unrounded) font metrics, used to scale each glyph onto the integer cell.
  let advance = fontSize * 0.6;
  let ascent = fontSize * 0.8;
  let descent = fontSize * 0.2;

  const dpr = () => win.devicePixelRatio || 1;

  function measureCell() {
    advance = fontSize * 0.6;
    ascent = fontSize * 0.8;
    descent = fontSize * 0.2;
    if (ctx) {
      ctx.font = `${fontSize}px ${fontFamily}`;
      const m = ctx.measureText('M');
      if (m.width) advance = m.width;
      if (typeof m.fontBoundingBoxAscent === 'number') ascent = m.fontBoundingBoxAscent;
      if (typeof m.fontBoundingBoxDescent === 'number') descent = m.fontBoundingBoxDescent;
    }
    grid.cell = cellDimensions(advance, ascent + descent);
  }

  function render() {
    if (!ctx) return;
    const ratio = dpr();
    const w = canvas.width / ratio;
    const h = canvas.height / ratio;

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    const W = grid.cell.width;
    const H = grid.cell.height;
    const sx = W / advance;
    const sy = H / (ascent + descent);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `${fontSize}px ${fontFamily}`;

    cells.forEach((x, y, cell) => {
      const px = x * W;
      const py = y * H;
      if (cell.bg) {
        ctx.fillStyle = cell.bg;
        ctx.fillRect(px, py, W, H);
      }
      if (cell.ch) {
        ctx.fillStyle = cell.fg || DEFAULT_FG;
        // Scale the glyph's natural box onto the integer cell so it fills it.
        ctx.save();
        ctx.translate(px, py);
        ctx.scale(sx, sy);
        ctx.fillText(cell.ch, advance / 2, ascent);
        ctx.restore();
      }
    });
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

  function setFontFamily(family) {
    fontFamily = family || DEFAULT_FONT_FAMILY;
    grid.fontFamily = fontFamily;
    return resize(); // re-measure the cell, re-fit cols/rows, redraw
  }

  return { grid, resize, render, measureCell, setFontFamily };
}
