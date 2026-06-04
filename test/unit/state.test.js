import { describe, it, expect } from 'vitest';
import {
  APP_NAME,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  cellKey,
  cellSize,
  gridDimensions,
} from '../../src/state.js';

describe('state', () => {
  it('exposes the app name and font defaults', () => {
    expect(APP_NAME).toBe('Mockscii');
    expect(DEFAULT_FONT_FAMILY).toBe('monospace');
    expect(DEFAULT_FONT_SIZE).toBeGreaterThan(0);
  });

  it('builds a stable cell key', () => {
    expect(cellKey(3, 7)).toBe('3,7');
    expect(cellKey(0, 0)).toBe('0,0');
  });
});

describe('cellSize', () => {
  it('rounds the advance width and derives a taller height', () => {
    const cell = cellSize(16, 9.6);
    expect(cell.width).toBe(10);
    expect(cell.height).toBe(Math.round(16 * 1.4));
    expect(cell.height).toBeGreaterThan(cell.width);
  });

  it('never produces a zero-sized cell', () => {
    const cell = cellSize(0, 0);
    expect(cell.width).toBeGreaterThanOrEqual(1);
    expect(cell.height).toBeGreaterThanOrEqual(1);
  });
});

describe('gridDimensions', () => {
  it('fits whole cells into the available area', () => {
    const dims = gridDimensions(105, 88, { width: 10, height: 20 });
    expect(dims).toEqual({ cols: 10, rows: 4 });
  });

  it('clamps to zero for an empty area', () => {
    expect(gridDimensions(0, 0, { width: 10, height: 20 })).toEqual({ cols: 0, rows: 0 });
  });
});
