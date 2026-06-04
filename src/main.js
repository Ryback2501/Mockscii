// Mockscii entry point. The real editor is assembled here task-by-task.
import { APP_NAME, cellKey } from './state.js';
import { createGrid } from './grid.js';
import { createGlyphSelector } from './glyph-selector.js';
import { createCellStore } from './cells.js';
import { createDrawController } from './draw.js';
import { createToolbar } from './toolbar.js';
import { createPalette } from './palette.js';
import { DEFAULT_GLYPH } from './glyphs.js';

export function init(doc = document, win = typeof window !== 'undefined' ? window : globalThis) {
  const canvas = doc.getElementById('grid');
  const cells = createCellStore();

  // Active tools. fg/bg get real values once the palette task lands.
  const tools = {
    glyph: DEFAULT_GLYPH,
    fg: '#d4d4d4',
    bg: null,
    mode: 'draw', // 'draw' | 'select'
    activeChannel: 'fg', // which colour channel palette picks assign to
  };

  let grid = null;
  let draw = null;

  if (canvas) {
    grid = createGrid(canvas, { window: win, cells });
    grid.resize();

    // Re-fit whenever the grid area changes size.
    if (typeof win.ResizeObserver === 'function') {
      const ro = new win.ResizeObserver(() => grid.resize());
      ro.observe(canvas.parentElement ?? canvas);
    } else if (typeof win.addEventListener === 'function') {
      win.addEventListener('resize', () => grid.resize());
    }

    draw = createDrawController({ canvas, grid, cells, tools, window: win });
  }

  let toolbar = null;
  const toolbarEl = doc.getElementById('toolbar');
  if (toolbarEl) {
    toolbar = createToolbar(toolbarEl, { tools });
  }

  let palette = null;
  const paletteEl = doc.getElementById('palette');
  if (paletteEl) {
    palette = createPalette(paletteEl, {
      tools,
      onAssign: () => toolbar?.refresh(),
    });
  }

  let selector = null;
  const panel = doc.getElementById('glyph-selector');
  if (panel) {
    selector = createGlyphSelector(panel, {
      initial: tools.glyph,
      onSelect: (ch) => (tools.glyph = ch),
    });
    tools.glyph = selector.getSelected();
  }

  return { name: APP_NAME, cellKey, grid, selector, toolbar, palette, cells, tools, draw };
}

if (typeof document !== 'undefined') {
  // Expose a handle for e2e/debugging.
  window.__mockscii = init();
}
