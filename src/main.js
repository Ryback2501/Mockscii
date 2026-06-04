// Mockscii entry point. The real editor is assembled here task-by-task.
import { APP_NAME, cellKey } from './state.js';
import { createGrid } from './grid.js';

export function init(doc = document, win = typeof window !== 'undefined' ? window : globalThis) {
  const canvas = doc.getElementById('grid');
  let grid = null;

  if (canvas) {
    grid = createGrid(canvas, { window: win });
    grid.resize();

    // Re-fit whenever the grid area changes size.
    if (typeof win.ResizeObserver === 'function') {
      const ro = new win.ResizeObserver(() => grid.resize());
      ro.observe(canvas.parentElement ?? canvas);
    } else if (typeof win.addEventListener === 'function') {
      win.addEventListener('resize', () => grid.resize());
    }
  }

  return { name: APP_NAME, cellKey, grid };
}

if (typeof document !== 'undefined') {
  init();
}
