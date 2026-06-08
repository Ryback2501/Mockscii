import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGrid } from '../../src/grid.js';
import { createCellStore } from '../../src/cells.js';
import { createTextCursorController } from '../../src/text-cursor.js';

function fakeCtx() {
  return {
    font: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    textAlign: '',
    textBaseline: '',
    globalAlpha: 1,
    setTransform: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 10 })),
  };
}

describe('text cursor', () => {
  let canvas, cells, grid, tools, ctrl;

  beforeEach(() => {
    document.body.innerHTML = '<canvas id="grid"></canvas>';
    canvas = document.getElementById('grid');
    canvas.getContext = vi.fn(() => fakeCtx());
    Object.defineProperty(canvas, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(canvas, 'clientHeight', { value: 600, configurable: true });
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600 });
    Object.defineProperty(window, 'devicePixelRatio', { value: 1, configurable: true });

    cells = createCellStore();
    grid = createGrid(canvas, { window, cells });
    grid.resize(); // cell 10x16
    tools = { tool: 'text', glyph: '#', fg: null, bg: null };
    ctrl = createTextCursorController({ canvas, grid, cells, tools, window });
  });

  function place(x, y) {
    canvas.dispatchEvent(
      new window.MouseEvent('mousedown', { clientX: x, clientY: y, button: 0, bubbles: true }),
    );
  }
  function key(k) {
    window.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true }));
  }

  it('places a caret on click and types advancing to the right', () => {
    place(25, 5); // col 2, row 0
    key('h');
    key('i');
    expect(cells.get(2, 0)).toMatchObject({ ch: 'h' });
    expect(cells.get(3, 0)).toMatchObject({ ch: 'i' });
    expect(ctrl.getCursor()).toMatchObject({ x: 4, y: 0, startCol: 2 });
  });

  it('Enter returns to the start column on the next row', () => {
    place(25, 5);
    key('a');
    key('Enter');
    expect(ctrl.getCursor()).toMatchObject({ x: 2, y: 1 });
  });

  it('Backspace moves left and clears the cell', () => {
    place(25, 5);
    key('h');
    expect(cells.has(2, 0)).toBe(true);
    key('Backspace');
    expect(ctrl.getCursor()).toMatchObject({ x: 2, y: 0 });
    expect(cells.has(2, 0)).toBe(false);
  });

  it('Escape deactivates the caret', () => {
    place(25, 5);
    key('h');
    key('Escape');
    expect(ctrl.getCursor()).toBeNull();
  });

  it('ignores typing when the text tool is not active', () => {
    place(25, 5);
    tools.tool = 'draw';
    key('z');
    expect(cells.size).toBe(0);
  });

  it('commits an undo checkpoint per line and on exit', () => {
    const history = { commit: vi.fn() };
    const c = createTextCursorController({ canvas, grid, cells, tools, window, history });
    canvas.dispatchEvent(
      new window.MouseEvent('mousedown', { clientX: 25, clientY: 5, button: 0, bubbles: true }),
    );
    key('a');
    key('Enter'); // commit #1
    key('b');
    key('Escape'); // commit #2
    expect(history.commit).toHaveBeenCalledTimes(2);
    c.destroy();
  });
});
