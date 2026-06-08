// Snapshot-based undo/redo over the sparse cell store. We keep a `baseline`
// snapshot of all painted cells plus an undo stack and a redo stack; each
// commit() records a checkpoint that undo()/redo() step between. Cells are only
// ever replaced (never mutated in place) elsewhere, so shallow copies are safe.

function snapshot(cells) {
  const list = [];
  cells.forEach((x, y, cell) => list.push({ x, y, cell: { ...cell } }));
  return list;
}

function restore(cells, list) {
  cells.clear();
  for (const { x, y, cell } of list) cells.set(x, y, { ...cell });
}

export function createHistory(cells, onChange = () => {}) {
  let baseline = snapshot(cells);
  const undoStack = [];
  const redoStack = [];

  return {
    /** Record the current cell state as a new checkpoint (drops the redo stack). */
    commit() {
      undoStack.push(baseline);
      baseline = snapshot(cells);
      redoStack.length = 0;
      onChange();
    },
    undo() {
      if (!undoStack.length) return false;
      redoStack.push(baseline);
      baseline = undoStack.pop();
      restore(cells, baseline);
      onChange();
      return true;
    },
    redo() {
      if (!redoStack.length) return false;
      undoStack.push(baseline);
      baseline = redoStack.pop();
      restore(cells, baseline);
      onChange();
      return true;
    },
    canUndo: () => undoStack.length > 0,
    canRedo: () => redoStack.length > 0,
  };
}
