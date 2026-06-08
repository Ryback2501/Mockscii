// Canvas-backed character grid: auto-fits its container, derives cols/rows from
// the available pixel area divided by the cell size, and redraws crisply on
// resize.
//
// Glyphs are printed the way a terminal does: each one is drawn at its NATURAL
// font size, left-aligned to the cell and sitting on the baseline (cell width =
// the monospace advance, cell height = the font's line box). The only exception
// is the Block Elements (█ ▀ ▄ …), which are drawn as exact rectangles so they
// fill the cell perfectly on any font — just like a quality terminal. A faint
// grid is drawn behind the cells.
import { DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE, cellDimensions, gridDimensions } from './state.js';
import { blockSpec } from './blocks.js';

const BG_COLOR = '#1e1e1e';
const GRID_LINE = 'rgba(255, 255, 255, 0.05)';
const DEFAULT_FG = '#d4d4d4';

export function createGrid(canvas, options = {}) {
  const win = options.window ?? (typeof window !== 'undefined' ? window : globalThis);
  let fontFamily = options.fontFamily ?? DEFAULT_FONT_FAMILY;
  let fontSize = options.fontSize ?? DEFAULT_FONT_SIZE;
  const cells = options.cells ?? { forEach() {} };
  const selection = options.selection ?? { keys: new Set(), offset: null };
  // Resolves a palette colour id to a hex string; dangling/null -> default.
  const colorOf = options.colorOf ?? (() => undefined);
  const ctx = canvas.getContext ? canvas.getContext('2d') : null;

  const grid = {
    cols: 0,
    rows: 0,
    cell: { width: 0, height: 0 },
    fontFamily,
    fontSize,
  };

  // Baseline offset (top of cell to the text baseline), in CSS pixels — glyphs
  // are drawn here at natural size, the way a terminal prints them.
  let baselineY = fontSize * 0.8;

  const dpr = () => win.devicePixelRatio || 1;

  function measureCell() {
    let advance = fontSize * 0.6;
    let fAscent = fontSize * 0.8;
    let fDescent = fontSize * 0.2;

    if (ctx) {
      ctx.font = `${fontSize}px ${fontFamily}`;
      const mM = ctx.measureText('M');
      if (mM.width) advance = mM.width;
      if (typeof mM.fontBoundingBoxAscent === 'number') fAscent = mM.fontBoundingBoxAscent;
      if (typeof mM.fontBoundingBoxDescent === 'number') fDescent = mM.fontBoundingBoxDescent;
    }

    baselineY = fAscent;

    // Cell width tracks the monospace advance; height is the font's line box.
    grid.cell = cellDimensions(advance, fAscent + fDescent);
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

    // Faint editing grid, drawn behind the characters so painted cells cover it.
    ctx.strokeStyle = GRID_LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const right = grid.cols * W;
    const bottom = grid.rows * H;
    for (let c = 0; c <= grid.cols; c++) {
      const lx = Math.round(c * W) + 0.5;
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, bottom);
    }
    for (let r = 0; r <= grid.rows; r++) {
      const ly = Math.round(r * H) + 0.5;
      ctx.moveTo(0, ly);
      ctx.lineTo(right, ly);
    }
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `${fontSize}px ${fontFamily}`;

    cells.forEach((x, y, cell) => {
      const px = x * W;
      const py = y * H;
      const bgColor = colorOf(cell.bg);
      const fgColor = colorOf(cell.fg) ?? DEFAULT_FG;
      if (bgColor) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(px, py, W, H);
      }
      if (cell.ch) {
        ctx.fillStyle = fgColor;
        const block = blockSpec(cell.ch);
        if (block) {
          // Block elements render as exact rectangles — pixel-perfect on any font.
          ctx.save();
          if (block.alpha != null) ctx.globalAlpha = block.alpha;
          for (const [fx, fy, fw, fh] of block.rects) {
            ctx.fillRect(px + fx * W, py + fy * H, fw * W, fh * H);
          }
          ctx.restore();
        } else {
          // Every other glyph prints at its natural size on the baseline, just
          // like a terminal — left-aligned to the cell, no scaling.
          ctx.fillText(cell.ch, px, py + baselineY);
        }
      }
    });

    // Selection highlight, drawn on top (shifted live while a move drag is active).
    if (selection.keys && selection.keys.size) {
      const ox = selection.offset?.x ?? 0;
      const oy = selection.offset?.y ?? 0;
      ctx.save();
      ctx.fillStyle = 'rgba(78, 161, 255, 0.25)';
      ctx.strokeStyle = 'rgba(78, 161, 255, 0.9)';
      ctx.lineWidth = 1;
      selection.keys.forEach((key) => {
        const comma = key.indexOf(',');
        const hx = (Number(key.slice(0, comma)) + ox) * W;
        const hy = (Number(key.slice(comma + 1)) + oy) * H;
        ctx.fillRect(hx, hy, W, H);
        ctx.strokeRect(hx + 0.5, hy + 0.5, W - 1, H - 1);
      });
      ctx.restore();
    }
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

  // Change the font family and, optionally, its render size in one step.
  function setFontFamily(family, size) {
    fontFamily = family || DEFAULT_FONT_FAMILY;
    grid.fontFamily = fontFamily;
    if (typeof size === 'number' && size > 0) {
      fontSize = size;
      grid.fontSize = fontSize;
    }
    return resize(); // re-measure the cell, re-fit cols/rows, redraw
  }

  // Set just the render size (ready for a future size picker).
  function setFontSize(size) {
    if (typeof size === 'number' && size > 0) {
      fontSize = size;
      grid.fontSize = fontSize;
    }
    return resize();
  }

  return { grid, resize, render, measureCell, setFontFamily, setFontSize };
}
