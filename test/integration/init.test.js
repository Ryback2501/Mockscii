import { describe, it, expect, beforeEach, vi } from 'vitest';
import { init } from '../../src/main.js';

// jsdom has no real 2d canvas; stub a context that records calls.
function fakeCtx() {
  return {
    font: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    setTransform: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    measureText: vi.fn(() => ({ width: 10 })),
  };
}

function sizeCanvas(canvas, w, h) {
  Object.defineProperty(canvas, 'clientWidth', { value: w, configurable: true });
  Object.defineProperty(canvas, 'clientHeight', { value: h, configurable: true });
}

describe('init (integration)', () => {
  let canvas;

  beforeEach(() => {
    document.body.innerHTML = `
      <main id="app">
        <section id="grid-area"><canvas id="grid"></canvas></section>
        <aside id="side-panel"></aside>
      </main>`;
    canvas = document.getElementById('grid');
    canvas.getContext = vi.fn(() => fakeCtx());
    sizeCanvas(canvas, 800, 600);
    Object.defineProperty(window, 'devicePixelRatio', { value: 2, configurable: true });
  });

  it('wires up the app and returns the public surface', () => {
    const api = init(document, window);
    expect(api.name).toBe('Mockscii');
    expect(api.cellKey(1, 2)).toBe('1,2');
    expect(api.grid).toBeTruthy();
  });

  it('auto-fits cols/rows from the canvas size and cell size', () => {
    const { grid } = init(document, window).grid;
    expect(grid.cell).toEqual({ width: 10, height: 16 });
    expect(grid.cols).toBe(Math.floor(800 / grid.cell.width));
    expect(grid.rows).toBe(Math.floor(600 / grid.cell.height));
  });

  it('sets the backing buffer to css size * devicePixelRatio', () => {
    init(document, window);
    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1200);
  });

  it('refits when the container resizes', () => {
    const api = init(document, window);
    sizeCanvas(canvas, 400, 300);
    api.grid.resize();
    expect(api.grid.grid.cols).toBe(Math.floor(400 / 10));
    expect(api.grid.grid.rows).toBe(Math.floor(300 / 16));
  });

  it('switches the erase tool to draw when a glyph is picked', () => {
    document.body.innerHTML = `
      <main id="app">
        <div id="top-bar"><div id="toolbar"></div></div>
        <section id="grid-area"><canvas id="grid"></canvas></section>
        <aside id="side-panel"><section id="glyph-selector"></section></aside>
      </main>`;
    const c = document.getElementById('grid');
    c.getContext = vi.fn(() => fakeCtx());
    sizeCanvas(c, 800, 600);

    const api = init(document, window);
    api.tools.tool = 'erase';
    document.querySelector('#glyph-selector button.glyph').click();

    expect(api.tools.tool).toBe('draw');
    expect(api.toolbar.drawButton.classList.contains('active')).toBe(true);
  });
});
