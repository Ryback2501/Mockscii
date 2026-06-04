import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFontSelector } from '../../src/font-selector.js';
import { FONT_OPTIONS, DEFAULT_FONT } from '../../src/fonts.js';
import { createGrid } from '../../src/grid.js';

describe('font selector', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = '<div id="font-control"></div>';
    container = document.getElementById('font-control');
  });

  it('renders a labelled dropdown with every font option', () => {
    createFontSelector(container, {});
    const select = container.querySelector('select');
    expect(container.querySelector('label')).toBeTruthy();
    expect(select.querySelectorAll('option')).toHaveLength(FONT_OPTIONS.length);
    expect(select.value).toBe(DEFAULT_FONT);
  });

  it('reports the chosen value on change', () => {
    const seen = [];
    const fs = createFontSelector(container, { onChange: (v) => seen.push(v) });
    const target = FONT_OPTIONS[5].value;
    fs.setValue(target);
    fs.select.dispatchEvent(new window.Event('change'));
    expect(seen).toEqual([target]);
    expect(fs.getValue()).toBe(target);
  });
});

describe('grid.setFontFamily', () => {
  it('updates the font family and re-renders', () => {
    document.body.innerHTML = '<canvas id="grid"></canvas>';
    const canvas = document.getElementById('grid');
    const ctx = {
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
    canvas.getContext = () => ctx;
    Object.defineProperty(canvas, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(canvas, 'clientHeight', { value: 600, configurable: true });

    const grid = createGrid(canvas, { window });
    grid.resize();
    grid.setFontFamily("'Fira Code', monospace");
    expect(grid.grid.fontFamily).toBe("'Fira Code', monospace");
    expect(ctx.font).toContain('Fira Code');
  });
});
