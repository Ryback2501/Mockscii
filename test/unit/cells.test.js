import { describe, it, expect } from 'vitest';
import { createCellStore } from '../../src/cells.js';

describe('cell store', () => {
  it('sets, gets, and reports size', () => {
    const s = createCellStore();
    expect(s.size).toBe(0);
    s.set(2, 3, { ch: 'A', fg: '#fff', bg: null });
    expect(s.size).toBe(1);
    expect(s.get(2, 3)).toEqual({ ch: 'A', fg: '#fff', bg: null });
    expect(s.has(2, 3)).toBe(true);
    expect(s.get(0, 0)).toBeUndefined();
  });

  it('overwrites the same cell rather than duplicating', () => {
    const s = createCellStore();
    s.set(1, 1, { ch: 'A' });
    s.set(1, 1, { ch: 'B' });
    expect(s.size).toBe(1);
    expect(s.get(1, 1)).toEqual({ ch: 'B' });
  });

  it('deletes and clears', () => {
    const s = createCellStore();
    s.set(0, 0, { ch: 'X' });
    s.set(5, 9, { ch: 'Y' });
    expect(s.delete(0, 0)).toBe(true);
    expect(s.has(0, 0)).toBe(false);
    expect(s.size).toBe(1);
    s.clear();
    expect(s.size).toBe(0);
  });

  it('iterates painted cells with coordinates', () => {
    const s = createCellStore();
    s.set(2, 3, { ch: 'A' });
    s.set(10, 0, { ch: 'B' });
    const seen = [];
    s.forEach((x, y, cell) => seen.push([x, y, cell.ch]));
    expect(seen).toContainEqual([2, 3, 'A']);
    expect(seen).toContainEqual([10, 0, 'B']);
  });
});
