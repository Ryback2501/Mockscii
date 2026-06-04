import { describe, it, expect } from 'vitest';
import {
  APP_NAME,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  cellKey,
  cellDimensions,
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

describe('cellDimensions', () => {
  it('rounds the advance to width and the line box to height', () => {
    const cell = cellDimensions(9.6, 18.4);
    expect(cell).toEqual({ width: 10, height: 18 });
  });

  it('never produces a zero-sized cell', () => {
    expect(cellDimensions(0, 0)).toEqual({ width: 1, height: 1 });
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
