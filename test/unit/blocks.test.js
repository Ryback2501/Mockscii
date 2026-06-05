import { describe, it, expect } from 'vitest';
import { blockSpec } from '../../src/blocks.js';

describe('blockSpec', () => {
  it('returns null for non-block characters', () => {
    expect(blockSpec('A')).toBeNull();
    expect(blockSpec('─')).toBeNull(); // box-drawing, not a block element
    expect(blockSpec('')).toBeNull();
  });

  it('maps the full block to the whole cell', () => {
    expect(blockSpec('█')).toEqual({ rects: [[0, 0, 1, 1]] });
  });

  it('maps half blocks to the right half-cell rectangles', () => {
    expect(blockSpec('▀')).toEqual({ rects: [[0, 0, 1, 0.5]] }); // upper
    expect(blockSpec('▄')).toEqual({ rects: [[0, 0.5, 1, 0.5]] }); // lower
    expect(blockSpec('▌')).toEqual({ rects: [[0, 0, 0.5, 1]] }); // left
    expect(blockSpec('▐')).toEqual({ rects: [[0.5, 0, 0.5, 1]] }); // right
  });

  it('maps shades to a full-cell fill with reduced alpha', () => {
    expect(blockSpec('░')).toEqual({ rects: [[0, 0, 1, 1]], alpha: 0.25 });
    expect(blockSpec('▓')).toEqual({ rects: [[0, 0, 1, 1]], alpha: 0.75 });
  });

  it('maps lower-eighth and quadrant blocks', () => {
    expect(blockSpec('▁')).toEqual({ rects: [[0, 7 / 8, 1, 1 / 8]] }); // bottom 1/8
    expect(blockSpec('▖')).toEqual({ rects: [[0, 0.5, 0.5, 0.5]] }); // lower-left quadrant
  });
});
