import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGrid } from '../../src/grid.js';
import { createCellStore } from '../../src/cells.js';

function makeCtx() {
  return {
    font: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    textAlign: '',
    textBaseline: '',
    setTransform: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    strokeRect: vi.fn(),
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
    // Cells reference palette colour ids; resolve them for rendering.
    const colorOf = (id) => ({ 1: '#ffffff', 2: '#222222', 3: '#00ff00' })[id];
    grid = createGrid(canvas, { window, cells, colorOf });
  });

  it('sizes the cell from the font line box (advance x ascent+descent)', () => {
    grid.resize();
    // width = round(9.6) = 10, height = round(14 + 4) = 18
    expect(grid.grid.cell).toEqual({ width: 10, height: 18 });
  });

  it('fills the cell background and draws the glyph at natural size on the baseline', () => {
    cells.set(2, 1, { ch: 'A', fg: 1, bg: 2 });
    grid.resize();

    const { width: W, height: H } = grid.grid.cell;
    // Background fills the whole cell.
    expect(ctx.fillRect).toHaveBeenCalledWith(2 * W, 1 * H, W, H);
    // The glyph is printed at natural size (no scaling transform) on the baseline.
    expect(ctx.scale).not.toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalledWith('A', expect.any(Number), expect.any(Number));
  });

  it('renders block elements as exact rectangles, not glyphs', () => {
    cells.set(1, 1, { ch: '█', fg: 3, bg: null });
    grid.resize();
    const { width: W, height: H } = grid.grid.cell;
    // Full block fills the whole cell via fillRect (no fillText for it).
    expect(ctx.fillRect).toHaveBeenCalledWith(1 * W, 1 * H, W, H);
    expect(ctx.fillText).not.toHaveBeenCalled();
  });

  it('draws a highlight outline for selected cells', () => {
    const selection = { keys: new Set(['1,1']), offset: null };
    const g = createGrid(canvas, { window, cells, selection });
    g.resize();
    expect(ctx.strokeRect).toHaveBeenCalled();
  });

  it('changes the render size via setFontFamily(family, size) and setFontSize', () => {
    grid.resize();
    grid.setFontFamily('monospace', 22);
    expect(grid.grid.fontSize).toBe(22);
    grid.setFontSize(10);
    expect(grid.grid.fontSize).toBe(10);
    // A non-positive size is ignored.
    grid.setFontSize(0);
    expect(grid.grid.fontSize).toBe(10);
  });

  it('draws the grid lines behind the characters', () => {
    cells.set(0, 0, { ch: '#', fg: 1, bg: null });
    grid.resize();

    expect(ctx.stroke).toHaveBeenCalled();
    // Grid lines are stroked before any glyph is filled, so cells sit on top.
    const strokeOrder = ctx.stroke.mock.invocationCallOrder[0];
    const fillTextOrder = ctx.fillText.mock.invocationCallOrder[0];
    expect(strokeOrder).toBeLessThan(fillTextOrder);
  });
});
