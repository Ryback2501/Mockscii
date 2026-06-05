import { describe, it, expect } from 'vitest';
import { rectKeys } from '../../src/selection.js';

describe('rectKeys', () => {
  it('lists every cell in the rectangle, inclusive, regardless of corner order', () => {
    const keys = rectKeys(4, 3, 2, 1).sort();
    expect(keys).toHaveLength(9); // 3x3
    expect(keys).toContain('2,1');
    expect(keys).toContain('4,3');
    expect(keys).toContain('3,2');
  });

  it('handles a single cell', () => {
    expect(rectKeys(5, 5, 5, 5)).toEqual(['5,5']);
  });

  it('handles a row', () => {
    expect(rectKeys(0, 2, 3, 2)).toEqual(['0,2', '1,2', '2,2', '3,2']);
  });
});
