// Central app constants and helpers. Grows as features land.

export const APP_NAME = 'Mockscii';

/** Default monospace font used to render the grid. */
export const DEFAULT_FONT_FAMILY = 'monospace';

/** Default glyph font size, in CSS pixels. */
export const DEFAULT_FONT_SIZE = 16;

/** Stable key for a grid cell, used as the Map key in the sparse cell store. */
export function cellKey(x, y) {
  return `${x},${y}`;
}

/**
 * Integer pixel size of a single grid cell.
 * `advanceWidth` is the monospace glyph advance; `lineHeight` is the font's
 * full line box (ascent + descent). Using the real line box means rows sit
 * flush and block/box glyphs tile with zero spacing, like a terminal.
 */
export function cellDimensions(advanceWidth, lineHeight) {
  return {
    width: Math.max(1, Math.round(advanceWidth)),
    height: Math.max(1, Math.round(lineHeight)),
  };
}

/** Number of whole cells that fit in a pixel area of the given cell size. */
export function gridDimensions(pxWidth, pxHeight, cell) {
  return {
    cols: Math.max(0, Math.floor(pxWidth / cell.width)),
    rows: Math.max(0, Math.floor(pxHeight / cell.height)),
  };
}
