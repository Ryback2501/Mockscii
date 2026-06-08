import { describe, it, expect } from 'vitest';
import { floodFill } from '../../src/fill.js';
import { createCellStore } from '../../src/cells.js';

const A = { ch: 'A', fg: null, bg: null };
const B = { ch: 'B', fg: null, bg: null };

describe('floodFill', () => {
  it('fills a contiguous empty region bounded by the grid', () => {
    const cells = createCellStore();
    const changed = floodFill(cells, 0, 0, 3, 2, A);
    expect(changed).toBe(true);
    expect(cells.size).toBe(6);
    expect(cells.get(2, 1)).toEqual(A);
  });

  it('only fills cells matching the start cell, stopping at a wall', () => {
    const cells = createCellStore();
    cells.set(1, 0, B); // a vertical wall at x=1 splits the 3x2 grid
    cells.set(1, 1, B);
    floodFill(cells, 0, 0, 3, 2, A);
    expect(cells.get(0, 0)).toEqual(A);
    expect(cells.get(0, 1)).toEqual(A);
    expect(cells.get(1, 0)).toEqual(B); // wall untouched
    expect(cells.get(2, 0)).toBeUndefined(); // right region blocked off
  });

  it('replaces a contiguous region of matching glyphs', () => {
    const cells = createCellStore();
    for (let x = 0; x < 3; x++) cells.set(x, 0, A);
    const changed = floodFill(cells, 1, 0, 3, 1, B);
    expect(changed).toBe(true);
    expect(cells.get(0, 0)).toEqual(B);
    expect(cells.get(2, 0)).toEqual(B);
  });

  it('is a no-op when the region already has the paint content', () => {
    const cells = createCellStore();
    cells.set(0, 0, A);
    cells.set(1, 0, A);
    expect(floodFill(cells, 0, 0, 2, 1, A)).toBe(false);
  });

  it('erases a region when paint is null', () => {
    const cells = createCellStore();
    for (let x = 0; x < 3; x++) cells.set(x, 0, A);
    expect(floodFill(cells, 0, 0, 3, 1, null)).toBe(true);
    expect(cells.size).toBe(0);
  });

  it('ignores an out-of-bounds start', () => {
    expect(floodFill(createCellStore(), -1, 0, 3, 2, A)).toBe(false);
  });
});
