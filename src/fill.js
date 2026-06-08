// Flood fill over the sparse cell store. Starting at (x0,y0), replace the
// contiguous 4-connected region of cells whose content matches the start cell
// (same glyph + colours, or all-empty) with `paint` ({ch,fg,bg} or null to
// erase). Bounded to [0,cols) x [0,rows). Returns true if anything changed.

function sig(cell) {
  if (!cell || cell.ch == null || cell.ch === '') return '\0empty';
  return `${cell.ch}|${cell.fg ?? ''}|${cell.bg ?? ''}`;
}

export function floodFill(cells, x0, y0, cols, rows, paint) {
  if (x0 < 0 || y0 < 0 || x0 >= cols || y0 >= rows) return false;
  const match = sig(cells.get(x0, y0));
  if (match === sig(paint)) return false; // region already has this content

  const stack = [[x0, y0]];
  const seen = new Set();
  let changed = false;

  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
    const key = `${x},${y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (sig(cells.get(x, y)) !== match) continue;

    if (paint == null) cells.delete(x, y);
    else cells.set(x, y, { ...paint });
    changed = true;

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return changed;
}
