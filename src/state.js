// Central app constants and helpers. Grows as features land.

export const APP_NAME = 'Mockscii';

/** Stable key for a grid cell, used as the Map key in the sparse cell store. */
export function cellKey(x, y) {
  return `${x},${y}`;
}
