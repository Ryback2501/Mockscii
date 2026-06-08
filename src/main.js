// Mockscii entry point. The real editor is assembled here task-by-task.
import { APP_NAME, cellKey } from './state.js';
import { createGrid } from './grid.js';
import { createGlyphSelector } from './glyph-selector.js';
import { createCellStore } from './cells.js';
import { createDrawController } from './draw.js';
import { createSelectionController } from './selection.js';
import { createTextCursorController } from './text-cursor.js';
import { createToolbar } from './toolbar.js';
import { createPalette } from './palette.js';
import { createHistory } from './history.js';
import { createFontSelector } from './font-selector.js';
import { createIoControls } from './io-controls.js';
import { serialize, deserialize, applyToCells, downloadJSON } from './io.js';
import { DEFAULT_GLYPH } from './glyphs.js';
import { DEFAULT_FONT, getAvailableFonts, fontSizeFor } from './fonts.js';

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
    tool: 'draw', // 'draw' | 'erase' | 'fill' | 'select' (more in later PRs)
    activeChannel: 'fg', // which colour channel palette picks assign to
  };

  // Resolves a palette colour id to a hex string (palette is created below).
  const colorOf = (id) => palette?.colorOf(id);

  // Undo/redo over the cell store. onChange re-renders and refreshes the toolbar
  // buttons; grid/toolbar are assigned below but only used when it actually fires.
  const history = createHistory(cells, () => {
    grid?.render();
    toolbar?.refresh();
  });

  // Apply the active font globally (canvas grid + glyph previews via CSS var).
  doc.documentElement.style.setProperty('--mock-font', tools.font);

  let grid = null;
  let draw = null;
  let select = null;
  let textCursor = null;

  if (canvas) {
    grid = createGrid(canvas, {
      window: win,
      cells,
      selection,
      fontFamily: tools.font,
      fontSize: fontSizeFor(tools.font),
      colorOf,
    });
    grid.resize();

    // Re-fit whenever the grid area changes size.
    if (typeof win.ResizeObserver === 'function') {
      const ro = new win.ResizeObserver(() => grid.resize());
      ro.observe(canvas.parentElement ?? canvas);
    } else if (typeof win.addEventListener === 'function') {
      win.addEventListener('resize', () => grid.resize());
    }

    draw = createDrawController({ canvas, grid, cells, tools, window: win, history });
    select = createSelectionController({
      canvas,
      grid,
      cells,
      selection,
      tools,
      window: win,
      onChange: () => grid.render(),
      history,
    });
    textCursor = createTextCursorController({ canvas, grid, cells, tools, window: win, history });

    // Undo / redo keyboard shortcuts (ignored while typing in a form control).
    win.addEventListener?.('keydown', (ev) => {
      const t = ev.target;
      const tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t?.isContentEditable) return;
      if (!(ev.ctrlKey || ev.metaKey)) return;
      const k = ev.key.toLowerCase();
      if (k === 'z' && !ev.shiftKey) {
        ev.preventDefault();
        history.undo();
      } else if (k === 'y' || (k === 'z' && ev.shiftKey)) {
        ev.preventDefault();
        history.redo();
      }
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
    const apply = () => grid?.setFontFamily(value, fontSizeFor(value));
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
      history,
      onUndo: () => history.undo(),
      onRedo: () => history.redo(),
      // Wipe the canvas as one undoable step (no-op when already empty).
      onClear: () => {
        if (cells.size === 0) return;
        cells.clear();
        select?.clear();
        history.commit();
      },
      // Switching channel re-highlights that channel's selected swatch.
      // Leaving a tool tidies up its transient state.
      onToolChange: (tool) => {
        if (tool !== 'select') select?.clear();
        if (tool !== 'text') textCursor?.deactivate();
      },
    });
  }

  const paletteEl = doc.getElementById('palette');
  if (paletteEl) {
    palette = createPalette(paletteEl, {
      tools,
      // Assigning a colour (by id) also recolours the current selection.
      onAssign: (channel, id) => select?.recolor(channel, id),
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
        history.commit(); // loading a file is one undo step
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
    history,
    cells,
    selection,
    tools,
    draw,
    select,
    textCursor,
  };
}

if (typeof document !== 'undefined') {
  // Expose a handle for e2e/debugging.
  window.__mockscii = init();
}
