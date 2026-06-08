import { describe, it, expect, beforeEach } from 'vitest';
import { createSelectionController } from '../../src/selection.js';
import { createCellStore } from '../../src/cells.js';

function makeGrid() {
  return {
    grid: { cell: { width: 10, height: 16 }, cols: 80, rows: 40 },
    render: () => {},
  };
}

describe('select mode controller', () => {
  let canvas, cells, selection, tools, grid, controller;

  beforeEach(() => {
    document.body.innerHTML = '<canvas id="grid"></canvas>';
    canvas = document.getElementById('grid');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 640 });
    cells = createCellStore();
    selection = { keys: new Set(), offset: null };
    tools = { tool: 'select', fg: '#fff', bg: null, activeChannel: 'fg' };
    grid = makeGrid();
    controller = createSelectionController({ canvas, grid, cells, selection, tools, window });
  });

  function mouse(type, x, y, opts = {}) {
    const ev = new window.MouseEvent(type, {
      clientX: x,
      clientY: y,
      button: 0,
      bubbles: true,
      ...opts,
    });
    (type === 'mousedown' ? canvas : window).dispatchEvent(ev);
  }
  const keys = () => [...selection.keys].sort();

  it('selects a single cell on click', () => {
    mouse('mousedown', 25, 25); // col 2, row 1
    mouse('mouseup', 25, 25);
    expect(keys()).toEqual(['2,1']);
  });

  it('rubber-band drag selects a rectangle', () => {
    mouse('mousedown', 5, 5); // (0,0)
    mouse('mousemove', 25, 25); // (2,1)
    mouse('mouseup', 25, 25);
    expect(selection.keys.size).toBe(6); // 3 cols x 2 rows
    expect(selection.keys.has('0,0')).toBe(true);
    expect(selection.keys.has('2,1')).toBe(true);
  });

  it('Ctrl+click toggles a cell in and out', () => {
    mouse('mousedown', 25, 25, { ctrlKey: true });
    mouse('mouseup', 25, 25, { ctrlKey: true });
    expect(selection.keys.has('2,1')).toBe(true);

    mouse('mousedown', 25, 25, { ctrlKey: true });
    mouse('mouseup', 25, 25, { ctrlKey: true });
    expect(selection.keys.has('2,1')).toBe(false);
  });

  it('does nothing in draw mode', () => {
    tools.tool = 'draw';
    mouse('mousedown', 25, 25);
    mouse('mouseup', 25, 25);
    expect(selection.keys.size).toBe(0);
  });

  it('Delete clears the content of selected cells', () => {
    cells.set(2, 1, { ch: 'A', fg: '#fff', bg: null });
    mouse('mousedown', 25, 25);
    mouse('mouseup', 25, 25);
    window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Delete' }));
    expect(cells.has(2, 1)).toBe(false);
  });

  it('moves the selection (and its content) on drag', () => {
    cells.set(2, 1, { ch: 'A', fg: '#fff', bg: null });
    mouse('mousedown', 25, 25); // select (2,1)
    mouse('mouseup', 25, 25);
    mouse('mousedown', 25, 25); // start move from selected cell
    mouse('mousemove', 45, 25); // to (4,1)
    mouse('mouseup', 45, 25);
    expect(cells.has(2, 1)).toBe(false);
    expect(cells.get(4, 1)).toMatchObject({ ch: 'A' });
    expect(selection.keys.has('4,1')).toBe(true);
  });

  it('recolours selected painted cells via the active channel', () => {
    cells.set(2, 1, { ch: 'A', fg: '#fff', bg: null });
    mouse('mousedown', 25, 25);
    mouse('mouseup', 25, 25);
    const changed = controller.recolor('bg', '#222222');
    expect(changed).toBe(true);
    expect(cells.get(2, 1)).toMatchObject({ ch: 'A', bg: '#222222' });
  });

  const hoverAt = (px, py) =>
    canvas.dispatchEvent(
      new window.MouseEvent('mousemove', { clientX: px, clientY: py, bubbles: true }),
    );

  it('copies the selection and pastes it at the hovered cell, selecting the result', () => {
    cells.set(1, 1, { ch: 'A', fg: null, bg: null });
    cells.set(2, 1, { ch: 'B', fg: null, bg: null });
    selection.keys = new Set(['1,1', '2,1']);

    expect(controller.copy()).toBe(true);
    hoverAt(55, 81); // cell (5,5)
    expect(controller.paste()).toBe(true);

    expect(cells.get(5, 5)).toMatchObject({ ch: 'A' });
    expect(cells.get(6, 5)).toMatchObject({ ch: 'B' });
    expect([...selection.keys].sort()).toEqual(['5,5', '6,5']);
  });

  it('pastes at the selection top-left when there is no hover', () => {
    cells.set(3, 3, { ch: 'X', fg: null, bg: null });
    selection.keys = new Set(['3,3']);
    controller.copy();
    selection.keys = new Set(['7,7']); // move the selection elsewhere
    expect(controller.paste()).toBe(true);
    expect(cells.get(7, 7)).toMatchObject({ ch: 'X' });
  });

  it('does not copy when no painted cells are selected', () => {
    selection.keys = new Set(['1,1']); // empty cell
    expect(controller.copy()).toBe(false);
    expect(controller.paste()).toBe(false); // nothing on the clipboard
  });
});
