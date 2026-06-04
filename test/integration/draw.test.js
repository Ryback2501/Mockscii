import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGrid } from '../../src/grid.js';
import { createCellStore } from '../../src/cells.js';
import { createDrawController } from '../../src/draw.js';

function fakeCtx() {
  return {
    font: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    textAlign: '',
    textBaseline: '',
    setTransform: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 10 })),
  };
}

describe('draw mode', () => {
  let canvas, cells, grid, tools;

  beforeEach(() => {
    document.body.innerHTML = '<canvas id="grid"></canvas>';
    canvas = document.getElementById('grid');
    canvas.getContext = vi.fn(() => fakeCtx());
    Object.defineProperty(canvas, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(canvas, 'clientHeight', { value: 600, configurable: true });
    canvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
    });
    Object.defineProperty(window, 'devicePixelRatio', { value: 1, configurable: true });

    cells = createCellStore();
    grid = createGrid(canvas, { window, cells });
    grid.resize(); // cell = 10x22 -> cols 80, rows 27
    tools = { glyph: '#', fg: '#fff', bg: null };
    createDrawController({ canvas, grid, cells, tools, window });
  });

  function mouse(type, x, y, button = 0) {
    const ev = new window.MouseEvent(type, { clientX: x, clientY: y, button, bubbles: true });
    (type === 'mousedown' ? canvas : window).dispatchEvent(ev);
  }

  it('paints the cell under a click', () => {
    mouse('mousedown', 25, 25); // col 2, row 1
    mouse('mouseup', 25, 25);
    expect(cells.size).toBe(1);
    expect(cells.get(2, 1)).toMatchObject({ ch: '#', fg: '#fff', bg: null });
  });

  it('paints a stroke while dragging and stops after mouseup', () => {
    mouse('mousedown', 5, 5); // col 0 row 0
    mouse('mousemove', 25, 5); // col 2 row 0
    mouse('mousemove', 45, 5); // col 4 row 0
    mouse('mouseup', 45, 5);
    mouse('mousemove', 65, 5); // ignored — not painting
    expect(cells.has(0, 0)).toBe(true);
    expect(cells.has(2, 0)).toBe(true);
    expect(cells.has(4, 0)).toBe(true);
    expect(cells.has(6, 0)).toBe(false);
  });

  it('ignores clicks outside the grid bounds', () => {
    mouse('mousedown', 5000, 5000);
    expect(cells.size).toBe(0);
  });

  it('does not paint when no glyph is active', () => {
    tools.glyph = '';
    mouse('mousedown', 25, 25);
    expect(cells.size).toBe(0);
  });
});
