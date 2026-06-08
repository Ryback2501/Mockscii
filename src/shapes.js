// Pure geometry helpers for the line and rectangle tools. Both return arrays of
// [x, y] integer cell coordinates (no bounds clamping — callers filter to the
// grid).

/** Cells along the line from (x0,y0) to (x1,y1), inclusive (Bresenham). */
export function linePoints(x0, y0, x1, y1) {
  const points = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;
  for (;;) {
    points.push([x, y]);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  return points;
}

/** Cells on the hollow rectangle border bounded by the two corners, inclusive. */
export function rectOutline(x0, y0, x1, y1) {
  const xlo = Math.min(x0, x1);
  const xhi = Math.max(x0, x1);
  const ylo = Math.min(y0, y1);
  const yhi = Math.max(y0, y1);
  const points = [];
  for (let x = xlo; x <= xhi; x++) {
    points.push([x, ylo]);
    if (yhi !== ylo) points.push([x, yhi]);
  }
  for (let y = ylo + 1; y < yhi; y++) {
    points.push([xlo, y]);
    if (xhi !== xlo) points.push([xhi, y]);
  }
  return points;
}
