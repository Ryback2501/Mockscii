import { describe, it, expect } from 'vitest';
import { linePoints, rectOutline } from '../../src/shapes.js';

describe('linePoints', () => {
  it('walks a horizontal run inclusive of both ends', () => {
    expect(linePoints(0, 2, 3, 2)).toEqual([
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
    ]);
  });

  it('walks a clean diagonal', () => {
    expect(linePoints(0, 0, 2, 2)).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
    ]);
  });

  it('handles a single point and reversed direction', () => {
    expect(linePoints(5, 5, 5, 5)).toEqual([[5, 5]]);
    const pts = linePoints(3, 0, 0, 0);
    expect(pts[0]).toEqual([3, 0]);
    expect(pts.at(-1)).toEqual([0, 0]);
  });
});

describe('rectOutline', () => {
  it('returns only the border of the rectangle, not the interior', () => {
    const pts = rectOutline(0, 0, 2, 2)
      .map(([x, y]) => `${x},${y}`)
      .sort();
    expect(pts).toHaveLength(8); // 3x3 border = 8 cells
    expect(pts).not.toContain('1,1'); // centre excluded
    expect(pts).toContain('0,0');
    expect(pts).toContain('2,2');
    expect(pts).toContain('1,0');
  });

  it('handles a single cell and a single row', () => {
    expect(rectOutline(5, 5, 5, 5)).toEqual([[5, 5]]);
    const row = rectOutline(0, 0, 2, 0)
      .map(([x, y]) => `${x},${y}`)
      .sort();
    expect(row).toEqual(['0,0', '1,0', '2,0']);
  });
});
