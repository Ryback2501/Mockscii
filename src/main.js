// Mockscii entry point. The real editor is assembled here task-by-task.
import { APP_NAME, cellKey } from './state.js';
import { createGrid } from './grid.js';
import { createGlyphSelector } from './glyph-selector.js';
import { createCellStore } from './cells.js';
import { createDrawController } from './draw.js';
import { createSelectionController } from './selection.js';
import { createToolbar } from './toolbar.js';
import { createPalette } from './palette.js';
import { createFontSelector } from './font-selector.js';
import { createIoControls } from './io-controls.js';
import { serialize, deserialize, applyToCells, downloadJSON } from './io.js';
import { DEFAULT_GLYPH } from './glyphs.js';
import { DEFAULT_FONT, getAvailableFonts } from './fonts.js';

export function init(doc = document, win = typeof window !== 'undefined' ? window : globalThis) {
  const canvas = doc.getElementById('grid');
  const cells = createCellStore();
  const selection = { keys: new Set(), offset: null };

  // Active tools. fg/bg hold palette colour *ids* (null = use the default).
  const tools = {
    glyph: DEFAULT_GLYPH,
    fg: null,
    bg: null,
    font: DEFAULT_FONT,
    mode: 'draw', // 'draw' | 'select'
    activeChannel: 'fg', // which colour channel palette picks assign to
  };

  // Resolves a palette colour id to a hex string (palette is created below).
  const colorOf = (id) => palette?.colorOf(id);

  // Apply the active font globally (canvas grid + glyph previews via CSS var).
  doc.documentElement.style.setProperty('--mock-font', tools.font);

  let grid = null;
  let draw = null;
  let select = null;

  if (canvas) {
    grid = createGrid(canvas, { window: win, cells, selection, fontFamily: tools.font, colorOf });
    grid.resize();

    // Re-fit whenever the grid area changes size.
    if (typeof win.ResizeObserver === 'function') {
      const ro = new win.ResizeObserver(() => grid.resize());
      ro.observe(canvas.parentElement ?? canvas);
    } else if (typeof win.addEventListener === 'function') {
      win.addEventListener('resize', () => grid.resize());
    }

    draw = createDrawController({ canvas, grid, cells, tools, window: win });
    select = createSelectionController({
      canvas,
      grid,
      cells,
      selection,
      tools,
      window: win,
      onChange: () => grid.render(),
    });
  }

  const available = getAvailableFonts({ document: doc });
  const fontByValue = new Map(available.map((f) => [f.value, f]));

  // Apply a font globally: record it, set the CSS var, and re-measure the grid
  // once the font has actually loaded (web fonts may not be ready synchronously).
  function applyFont(value) {
    tools.font = value;
    doc.documentElement.style.setProperty('--mock-font', value);
    const family = fontByValue.get(value)?.family;
    const apply = () => grid?.setFontFamily(value);
    if (family && doc.fonts?.load) {
      doc.fonts.load(`16px "${family}"`).then(apply, apply);
    } else {
      apply();
    }
  }

  let fontSelector = null;
  const fontEl = doc.getElementById('font-control');
  if (fontEl) {
    fontSelector = createFontSelector(fontEl, {
      fonts: available,
      initial: tools.font,
      onChange: (value) => applyFont(value),
    });
  }

  let toolbar = null;
  let palette = null;

  const toolbarEl = doc.getElementById('toolbar');
  if (toolbarEl) {
    toolbar = createToolbar(toolbarEl, {
      tools,
      colorOf,
      // Switching channel re-highlights that channel's selected swatch.
      onChannelChange: () => palette?.refresh(),
      // Switching mode clears any cell selection.
      onModeChange: () => select?.clear(),
    });
  }

  const paletteEl = doc.getElementById('palette');
  if (paletteEl) {
    palette = createPalette(paletteEl, {
      tools,
      // Assigning a colour (by id) also recolours the current selection.
      onAssign: (channel, id) => {
        toolbar?.refresh();
        select?.recolor(channel, id);
      },
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

  let io = null;
  const ioEl = doc.getElementById('io-controls');
  if (ioEl) {
    io = createIoControls(ioEl, {
      onExport: () => {
        const doc2 = serialize({
          font: tools.font,
          palette: palette?.getPalette() ?? [],
          cells,
        });
        downloadJSON(doc2, 'mockscii.json', doc);
      },
      onImport: (text) => {
        let parsed;
        try {
          parsed = deserialize(JSON.parse(text));
        } catch {
          return; // ignore invalid files
        }
        applyToCells(cells, parsed.cells);
        if (parsed.palette) palette?.setPalette(parsed.palette);
        if (parsed.font) {
          applyFont(parsed.font);
          fontSelector?.setValue(parsed.font);
        }
        grid?.render();
      },
    });
  }

  return {
    name: APP_NAME,
    cellKey,
    grid,
    selector,
    toolbar,
    palette,
    fontSelector,
    io,
    cells,
    selection,
    tools,
    draw,
    select,
  };
}

if (typeof document !== 'undefined') {
  // Expose a handle for e2e/debugging.
  window.__mockscii = init();
}
