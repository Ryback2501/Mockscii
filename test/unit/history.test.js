import { describe, it, expect, vi } from 'vitest';
import { createHistory } from '../../src/history.js';
import { createCellStore } from '../../src/cells.js';

const cell = (ch) => ({ ch, fg: null, bg: null });

describe('history', () => {
  it('undoes and redoes a single change', () => {
    const cells = createCellStore();
    const h = createHistory(cells);
    expect(h.canUndo()).toBe(false);

    cells.set(1, 1, cell('A'));
    h.commit();
    expect(h.canUndo()).toBe(true);
    expect(h.canRedo()).toBe(false);

    h.undo();
    expect(cells.size).toBe(0);
    expect(h.canUndo()).toBe(false);
    expect(h.canRedo()).toBe(true);

    h.redo();
    expect(cells.get(1, 1)).toEqual(cell('A'));
    expect(h.canRedo()).toBe(false);
  });

  it('steps through multiple checkpoints', () => {
    const cells = createCellStore();
    const h = createHistory(cells);
    cells.set(0, 0, cell('x'));
    h.commit();
    cells.set(1, 0, cell('y'));
    h.commit();

    expect(cells.size).toBe(2);
    h.undo();
    expect(cells.has(1, 0)).toBe(false);
    expect(cells.size).toBe(1);
    h.undo();
    expect(cells.size).toBe(0);
    h.redo();
    h.redo();
    expect(cells.size).toBe(2);
  });

  it('drops the redo stack after a new commit', () => {
    const cells = createCellStore();
    const h = createHistory(cells);
    cells.set(0, 0, cell('a'));
    h.commit();
    h.undo();
    expect(h.canRedo()).toBe(true);

    cells.set(2, 2, cell('b'));
    h.commit();
    expect(h.canRedo()).toBe(false);
  });

  it('isolates snapshots from later in-place replacement', () => {
    const cells = createCellStore();
    const h = createHistory(cells);
    cells.set(0, 0, cell('a'));
    h.commit();
    cells.set(0, 0, cell('b'));
    h.commit();
    h.undo();
    expect(cells.get(0, 0).ch).toBe('a');
  });

  it('notifies onChange on commit, undo and redo', () => {
    const cells = createCellStore();
    const onChange = vi.fn();
    const h = createHistory(cells, onChange);
    cells.set(0, 0, cell('a'));
    h.commit();
    h.undo();
    h.redo();
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('undo/redo are no-ops on empty stacks', () => {
    const h = createHistory(createCellStore());
    expect(h.undo()).toBe(false);
    expect(h.redo()).toBe(false);
  });
});
