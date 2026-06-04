import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGrid } from '../../src/grid.js';
import { createCellStore } from '../../src/cells.js';

function makeCtx() {
  return {
    font: '',
    fillStyle: '',
    textAlign: '',
    textBaseline: '',
    setTransform: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    // Real-ish font metrics so the line box (and scale factors) are exercised.
    measureText: vi.fn(() => ({
      width: 9.6,
      fontBoundingBoxAscent: 14,
      fontBoundingBoxDescent: 4,
    })),
  };
}

describe('grid render', () => {
  let canvas, ctx, cells, grid;

  beforeEach(() => {
    document.body.innerHTML = '<canvas id="grid"></canvas>';
    canvas = document.getElementById('grid');
    ctx = makeCtx();
    canvas.getContext = () => ctx;
    Object.defineProperty(canvas, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(canvas, 'clientHeight', { value: 600, configurable: true });
    Object.defineProperty(window, 'devicePixelRatio', { value: 1, configurable: true });

    cells = createCellStore();
    grid = createGrid(canvas, { window, cells });
  });

  it('sizes the cell from the font line box (advance x ascent+descent)', () => {
    grid.resize();
    // width = round(9.6) = 10, height = round(14 + 4) = 18
    expect(grid.grid.cell).toEqual({ width: 10, height: 18 });
  });

  it('fills the whole cell background and scales the glyph to fill the cell', () => {
    cells.set(2, 1, { ch: 'A', fg: '#fff', bg: '#222' });
    grid.resize();

    const { width: W, height: H } = grid.grid.cell;
    // Background covers the entire cell rectangle.
    expect(ctx.fillRect).toHaveBeenCalledWith(2 * W, 1 * H, W, H);
    // Glyph is drawn within a scale transform (fills the cell, baseline-aligned).
    expect(ctx.scale).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalledWith('A', expect.any(Number), expect.any(Number));
  });

  it('does not draw any grid lines', () => {
    cells.set(0, 0, { ch: '#', fg: '#fff', bg: null });
    grid.resize();
    expect(ctx.stroke).toBeUndefined();
  });
});
