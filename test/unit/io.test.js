import { describe, it, expect } from 'vitest';
import { SCHEMA_VERSION, serialize, deserialize, applyToCells } from '../../src/io.js';
import { createCellStore } from '../../src/cells.js';

describe('io serialize', () => {
  it('captures version, font, palette and cells from the store', () => {
    const cells = createCellStore();
    cells.set(1, 2, { ch: 'A', fg: 3, bg: null });
    cells.set(0, 0, { ch: '#', fg: null, bg: 7 });

    const doc = serialize({
      font: 'Fira Code',
      palette: [
        { id: 3, color: '#fff' },
        { id: 7, color: '#222' },
      ],
      cells,
    });

    expect(doc.version).toBe(SCHEMA_VERSION);
    expect(doc.font).toBe('Fira Code');
    expect(doc.palette).toEqual([
      { id: 3, color: '#fff' },
      { id: 7, color: '#222' },
    ]);
    expect(doc.cells).toHaveLength(2);
    expect(doc.cells).toContainEqual({ x: 1, y: 2, ch: 'A', fg: 3, bg: null });
    expect(doc.cells).toContainEqual({ x: 0, y: 0, ch: '#', fg: null, bg: 7 });
  });

  it('nulls a non-string font and an absent palette', () => {
    const doc = serialize({ font: 42, palette: undefined, cells: createCellStore() });
    expect(doc.font).toBeNull();
    expect(doc.palette).toEqual([]);
    expect(doc.cells).toEqual([]);
  });
});

describe('io deserialize', () => {
  it('throws on a non-object document', () => {
    expect(() => deserialize(null)).toThrow();
    expect(() => deserialize(42)).toThrow();
    expect(() => deserialize([1, 2])).toThrow();
  });

  it('drops malformed cells and keeps valid ones', () => {
    const { cells } = deserialize({
      cells: [
        { x: 1, y: 1, ch: 'A', fg: 1, bg: null },
        { x: 1.5, y: 1, ch: 'B' }, // non-integer x
        { x: 2, y: 2, ch: '' }, // empty glyph
        { x: 3, ch: 'C' }, // missing y
        'nope',
      ],
    });
    expect(cells).toEqual([{ x: 1, y: 1, ch: 'A', fg: 1, bg: null }]);
  });

  it('keeps a valid palette but nulls a malformed one', () => {
    expect(deserialize({ palette: [{ id: 1, color: '#fff' }] }).palette).toEqual([
      { id: 1, color: '#fff' },
    ]);
    expect(deserialize({ palette: ['#fff'] }).palette).toBeNull();
    expect(deserialize({ palette: [{ id: 'x', color: '#fff' }] }).palette).toBeNull();
    expect(deserialize({ palette: 'nope' }).palette).toBeNull();
  });

  it('nulls a non-string font', () => {
    expect(deserialize({ font: 'Mono' }).font).toBe('Mono');
    expect(deserialize({ font: 5 }).font).toBeNull();
  });
});

describe('serialize -> deserialize round-trip', () => {
  it('preserves cells and their colour ids', () => {
    const cells = createCellStore();
    cells.set(4, 5, { ch: 'Z', fg: 2, bg: 9 });
    const back = deserialize(
      serialize({ font: 'Mono', palette: [{ id: 2, color: '#abc' }], cells }),
    );
    expect(back.cells).toContainEqual({ x: 4, y: 5, ch: 'Z', fg: 2, bg: 9 });
    expect(back.palette).toEqual([{ id: 2, color: '#abc' }]);
  });
});

describe('applyToCells', () => {
  it('clears the store then loads the given list', () => {
    const cells = createCellStore();
    cells.set(9, 9, { ch: 'X', fg: null, bg: null });
    applyToCells(cells, [{ x: 1, y: 1, ch: 'A', fg: 2, bg: null }]);
    expect(cells.has(9, 9)).toBe(false);
    expect(cells.get(1, 1)).toEqual({ ch: 'A', fg: 2, bg: null });
    expect(cells.size).toBe(1);
  });
});
