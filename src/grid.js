// Canvas-backed character grid: auto-fits its container, derives cols/rows from
// the available pixel area divided by the cell size, and redraws crisply on
// resize.
//
// To make block/box glyphs tile seamlessly on ANY font, we measure the FULL
// BLOCK glyph (█) per font and scale every glyph so █ exactly fills the cell;
// other glyphs ride the same transform (so they keep their relative size and
// share a baseline). A faint grid is drawn behind the cells.
import { DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE, cellDimensions, gridDimensions } from './state.js';
import { blockSpec } from './blocks.js';

const BG_COLOR = '#1e1e1e';
const GRID_LINE = 'rgba(255, 255, 255, 0.05)';
const DEFAULT_FG = '#d4d4d4';

export function createGrid(canvas, options = {}) {
  const win = options.window ?? (typeof window !== 'undefined' ? window : globalThis);
  let fontFamily = options.fontFamily ?? DEFAULT_FONT_FAMILY;
  const fontSize = options.fontSize ?? DEFAULT_FONT_SIZE;
  const cells = options.cells ?? { forEach() {} };
  const selection = options.selection ?? { keys: new Set(), offset: null };
  const ctx = canvas.getContext ? canvas.getContext('2d') : null;

  const grid = {
    cols: 0,
    rows: 0,
    cell: { width: 0, height: 0 },
    fontFamily,
    fontSize,
  };

  // Transform that maps a glyph's draw origin so the FULL BLOCK fills the cell.
  let glyphOriginX = 0; // x to draw at (left edge of █ ink), in font units
  let glyphBaselineY = fontSize * 0.8; // baseline y (top of █ ink to baseline)
  let glyphScaleW = fontSize * 0.6; // █ ink width  -> scales to cell width
  let glyphScaleH = fontSize; // █ ink height -> scales to cell height

  const dpr = () => win.devicePixelRatio || 1;

  function measureCell() {
    let advance = fontSize * 0.6;
    let fAscent = fontSize * 0.8;
    let fDescent = fontSize * 0.2;
    let bLeft = 0;
    let bRight = advance;
    let bAscent = fAscent;
    let bDescent = fDescent;

    if (ctx) {
      ctx.font = `${fontSize}px ${fontFamily}`;
      const mM = ctx.measureText('M');
      if (mM.width) advance = mM.width;
      if (typeof mM.fontBoundingBoxAscent === 'number') fAscent = mM.fontBoundingBoxAscent;
      if (typeof mM.fontBoundingBoxDescent === 'number') fDescent = mM.fontBoundingBoxDescent;

      const mB = ctx.measureText('█');
      if (typeof mB.actualBoundingBoxLeft === 'number') bLeft = mB.actualBoundingBoxLeft;
      bRight =
        typeof mB.actualBoundingBoxRight === 'number'
          ? mB.actualBoundingBoxRight
          : mB.width || advance;
      bAscent =
        typeof mB.actualBoundingBoxAscent === 'number' ? mB.actualBoundingBoxAscent : fAscent;
      bDescent =
        typeof mB.actualBoundingBoxDescent === 'number' ? mB.actualBoundingBoxDescent : fDescent;
    }

    glyphOriginX = bLeft;
    glyphBaselineY = bAscent;
    glyphScaleW = bLeft + bRight || advance;
    glyphScaleH = bAscent + bDescent || fAscent + fDescent;

    // Cell width tracks the monospace advance; height tracks the block ink box.
    grid.cell = cellDimensions(advance, bAscent + bDescent);
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

    const sx = W / glyphScaleW;
    const sy = H / glyphScaleH;

    ctx.textAlign = 'left';
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
          // Other glyphs: scale onto the cell (sharing the █-derived transform).
          ctx.save();
          ctx.translate(px, py);
          ctx.scale(sx, sy);
          ctx.fillText(cell.ch, glyphOriginX, glyphBaselineY);
          ctx.restore();
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

  function setFontFamily(family) {
    fontFamily = family || DEFAULT_FONT_FAMILY;
    grid.fontFamily = fontFamily;
    return resize(); // re-measure the cell, re-fit cols/rows, redraw
  }

  return { grid, resize, render, measureCell, setFontFamily };
}
