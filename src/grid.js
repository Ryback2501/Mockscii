// Canvas-backed character grid: by default auto-fits its container, deriving
// cols/rows from the available pixel area divided by the cell size. A fixed
// canvas size (cols x rows) can be set instead, in which case the canvas is
// sized to exactly that many cells. Redraws crisply on resize.
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
export const GUIDE_COLOR = 'rgba(45, 212, 191, 0.9)'; // teal

export function createGrid(canvas, options = {}) {
  const win = options.window ?? (typeof window !== 'undefined' ? window : globalThis);
  let fontFamily = options.fontFamily ?? DEFAULT_FONT_FAMILY;
  let fontSize = options.fontSize ?? DEFAULT_FONT_SIZE;
  const cells = options.cells ?? { forEach() {} };
  const selection = options.selection ?? { keys: new Set(), offset: null };
  // Resolves a palette colour id to a hex string; dangling/null -> default.
  const colorOf = options.colorOf ?? (() => undefined);
  // Layout guides ({ v, h, visible, preview }), drawn above everything.
  const guides = options.guides ?? null;
  // Called after every resize (cell size / cols / rows may have changed).
  const onLayout = options.onLayout ?? (() => {});
  const ctx = canvas.getContext ? canvas.getContext('2d') : null;

  const grid = {
    cols: 0,
    rows: 0,
    cell: { width: 0, height: 0 },
    fontFamily,
    fontSize,
    fixed: false, // true while a fixed canvas size is set
    pxWidth: 0, // canvas CSS size
    pxHeight: 0,
  };

  // Baseline offset (top of cell to the text baseline), in CSS pixels — glyphs
  // are drawn here at natural size, the way a terminal prints them.
  let baselineY = fontSize * 0.8;

  // Transient overlay of cells previewed by a tool mid-drag (line/rect), plus an
  // optional dimension label ({ text, x, y } — anchored at cell x,y).
  let preview = null;
  let previewLabel = null;
  // Text-cursor caret position ({ x, y }) or null.
  let cursorPos = null;
  // Fixed canvas size ({ cols, rows }) or null to auto-fit the container.
  let fixedSize = null;

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

    const drawCell = (x, y, cell) => {
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
    };

    cells.forEach(drawCell);

    // Live tool preview (line/rect drag), drawn above cells at reduced opacity.
    if (preview && preview.length) {
      ctx.save();
      ctx.globalAlpha = 0.7;
      for (const p of preview) drawCell(p.x, p.y, p.cell);
      ctx.restore();
    }

    // Shape dimension tag (e.g. "12×5"), placed just below-right of the drag end
    // cell and kept inside the canvas.
    if (previewLabel) {
      ctx.save();
      ctx.font = '12px system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      const padX = 5;
      const tagW = Math.ceil(ctx.measureText(previewLabel.text).width) + padX * 2;
      const tagH = 18;
      let tx = (previewLabel.x + 1) * W + 4;
      let ty = (previewLabel.y + 1) * H + 4;
      if (tx + tagW > w) tx = previewLabel.x * W - tagW - 4;
      if (ty + tagH > h) ty = previewLabel.y * H - tagH - 4;
      tx = Math.max(0, tx);
      ty = Math.max(0, ty);
      ctx.fillStyle = 'rgba(78, 161, 255, 0.95)';
      ctx.fillRect(tx, ty, tagW, tagH);
      ctx.fillStyle = '#fff';
      ctx.fillText(previewLabel.text, tx + padX, ty + tagH / 2);
      ctx.restore();
    }

    // Selection highlight, drawn on top (shifted live while a move drag is
    // active): a translucent fill over the selected cells plus a single outer
    // rectangle around the whole selection — not a border per cell.
    if (selection.keys && selection.keys.size) {
      const ox = selection.offset?.x ?? 0;
      const oy = selection.offset?.y ?? 0;
      ctx.save();
      ctx.fillStyle = 'rgba(78, 161, 255, 0.25)';
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      selection.keys.forEach((key) => {
        const comma = key.indexOf(',');
        const cx = Number(key.slice(0, comma));
        const cy = Number(key.slice(comma + 1));
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;
        ctx.fillRect((cx + ox) * W, (cy + oy) * H, W, H);
      });
      ctx.strokeStyle = 'rgba(78, 161, 255, 0.9)';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        (minX + ox) * W + 0.5,
        (minY + oy) * H + 0.5,
        (maxX - minX + 1) * W - 1,
        (maxY - minY + 1) * H - 1,
      );
      ctx.restore();
    }

    // Text caret: a vertical bar on the left edge of the cursor cell.
    if (cursorPos) {
      ctx.save();
      ctx.fillStyle = 'rgba(78, 161, 255, 0.95)';
      ctx.fillRect(cursorPos.x * W, cursorPos.y * H, Math.max(2, W * 0.12), H);
      ctx.restore();
    }

    // Guides: full-length lines on cell edges, topmost layer. The guide being
    // dragged is drawn at its live position instead (dashed when it would be
    // deleted on drop).
    const p = guides?.preview;
    if (p || (guides?.visible && (guides.v.length || guides.h.length))) {
      ctx.save();
      ctx.fillStyle = GUIDE_COLOR;
      guides.v.forEach((c, i) => {
        if (!(p && p.axis === 'v' && p.index === i)) ctx.fillRect(Math.round(c * W), 0, 1, h);
      });
      guides.h.forEach((r, i) => {
        if (!(p && p.axis === 'h' && p.index === i)) ctx.fillRect(0, Math.round(r * H), w, 1);
      });
      if (p) {
        ctx.strokeStyle = GUIDE_COLOR;
        ctx.lineWidth = 1;
        if (!p.inside && ctx.setLineDash) ctx.setLineDash([4, 4]);
        ctx.beginPath();
        if (p.axis === 'v') {
          const x = Math.round(p.pos * W) + 0.5;
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
        } else {
          const y = Math.round(p.pos * H) + 0.5;
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function resize() {
    const ratio = dpr();
    measureCell();

    let cssW;
    let cssH;
    if (fixedSize) {
      grid.cols = fixedSize.cols;
      grid.rows = fixedSize.rows;
      cssW = grid.cols * grid.cell.width + 1; // +1 so the closing grid line shows
      cssH = grid.rows * grid.cell.height + 1;
      if (canvas.style) {
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
      }
    } else {
      cssW = canvas.clientWidth || canvas.parentElement?.clientWidth || 0;
      cssH = canvas.clientHeight || canvas.parentElement?.clientHeight || 0;
      const dims = gridDimensions(cssW, cssH, grid.cell);
      grid.cols = dims.cols;
      grid.rows = dims.rows;
    }

    grid.pxWidth = cssW;
    grid.pxHeight = cssH;
    canvas.width = Math.max(1, Math.round(cssW * ratio));
    canvas.height = Math.max(1, Math.round(cssH * ratio));
    if (ctx) ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    render();
    onLayout(grid);
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

  // Fix the grid at cols x rows cells, or pass null to auto-fit the container.
  function setSize(size) {
    const cols = Math.floor(size?.cols);
    const rows = Math.floor(size?.rows);
    fixedSize = cols > 0 && rows > 0 ? { cols, rows } : null;
    grid.fixed = fixedSize !== null;
    if (!fixedSize && canvas.style) {
      canvas.style.width = '';
      canvas.style.height = '';
    }
    return resize();
  }

  // Set (or clear) the transient tool preview overlay (and its optional
  // dimension label) and redraw.
  function setPreview(list, label = null) {
    preview = list && list.length ? list : null;
    previewLabel = preview && label ? label : null;
    render();
  }

  // Set (or clear) the text-cursor caret and redraw.
  function setCursor(pos) {
    cursorPos = pos ?? null;
    render();
  }

  // Set just the render size (ready for a future size picker).
  function setFontSize(size) {
    if (typeof size === 'number' && size > 0) {
      fontSize = size;
      grid.fontSize = fontSize;
    }
    return resize();
  }

  return {
    grid,
    resize,
    render,
    measureCell,
    setFontFamily,
    setFontSize,
    setSize,
    setPreview,
    setCursor,
  };
}
