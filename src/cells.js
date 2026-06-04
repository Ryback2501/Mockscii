// Sparse store of painted grid cells, keyed by "x,y". Empty cells are simply
// absent. Each value is { ch, fg, bg } (bg may be null for no background).
import { cellKey } from './state.js';

export function createCellStore() {
  const map = new Map();

  return {
    set(x, y, cell) {
      map.set(cellKey(x, y), cell);
    },
    get(x, y) {
      return map.get(cellKey(x, y));
    },
    has(x, y) {
      return map.has(cellKey(x, y));
    },
    delete(x, y) {
      return map.delete(cellKey(x, y));
    },
    clear() {
      map.clear();
    },
    get size() {
      return map.size;
    },
    /** Invoke fn(x, y, cell) for every painted cell. */
    forEach(fn) {
      for (const [key, cell] of map) {
        const comma = key.indexOf(',');
        fn(Number(key.slice(0, comma)), Number(key.slice(comma + 1)), cell);
      }
    },
  };
}
