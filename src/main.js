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
import { createSizeControl } from './size-control.js';
import { createGuides, createGuidesController } from './guides.js';
import { createRulers } from './rulers.js';
import { createCellInfo } from './cell-info.js';
import { createProjectStore, createProjectControl } from './projects.js';
import { createIoControls } from './io-controls.js';
import { serialize, deserialize, applyToCells, downloadJSON } from './io.js';
import { DEFAULT_GLYPH } from './glyphs.js';
import { DEFAULT_FONT, getAvailableFonts, fontSizeFor } from './fonts.js';

export function init(doc = document, win = typeof window !== 'undefined' ? window : globalThis) {
  const canvas = doc.getElementById('grid');
  const cells = createCellStore();
  const selection = { keys: new Set(), offset: null };
  const guides = createGuides();

  // Active tools. fg/bg hold palette colour *ids* (null = use the default).
  const tools = {
    glyph: DEFAULT_GLYPH,
    fg: null,
    bg: null,
    font: DEFAULT_FONT,
    tool: 'draw', // 'draw' | 'erase' | 'recolor' | 'fill' | 'line' | 'rect' | 'text' | 'select'
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
  let sizeControl = null;
  let rulers = null;
  let guideCtl = null;
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
      guides,
      onLayout: () => rulers?.render(),
    });
    grid.resize();

    const topRuler = doc.getElementById('ruler-top');
    const leftRuler = doc.getElementById('ruler-left');
    rulers = createRulers({ top: topRuler, left: leftRuler, grid, guides, window: win });
    rulers.render();
    guideCtl = createGuidesController({
      canvas,
      topRuler,
      leftRuler,
      grid,
      guides,
      window: win,
      onChange: () => {
        grid.render();
        rulers.render();
        guidesToggle?.classList.toggle('active', guides.visible);
        guidesToggle?.setAttribute('aria-pressed', String(guides.visible));
      },
    });

    // Re-fit whenever the grid area changes size (no-op on cols/rows when the
    // canvas size is fixed). The size control shows the fitted size live.
    const refit = () => {
      grid.resize();
      sizeControl?.refresh();
    };
    if (typeof win.ResizeObserver === 'function') {
      const ro = new win.ResizeObserver(refit);
      ro.observe(doc.getElementById('grid-area') ?? canvas.parentElement ?? canvas);
    } else if (typeof win.addEventListener === 'function') {
      win.addEventListener('resize', refit);
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
    createCellInfo({ canvas, grid, cells, window: win });
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

  // Fix the canvas at cols x rows (or null to auto-fit the window).
  function applySize(size) {
    grid?.setSize(size);
    doc.getElementById('grid-area')?.classList.toggle('fixed-size', !!grid?.grid.fixed);
  }

  const guidesToggle = doc.getElementById('guides-toggle');
  guidesToggle?.addEventListener('click', () => guideCtl?.toggle());

  const sizeEl = doc.getElementById('size-control');
  if (sizeEl) {
    sizeControl = createSizeControl(sizeEl, {
      getDims: () => ({ cols: grid?.grid.cols ?? 0, rows: grid?.grid.rows ?? 0 }),
      onChange: (size) => applySize(size),
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
      onSelect: (ch) => {
        tools.glyph = ch;
        // Picking a glyph while erasing means you want to draw it.
        if (tools.tool === 'erase') {
          tools.tool = 'draw';
          toolbar?.refresh();
        }
      },
    });
    tools.glyph = selector.getSelected();
  }

  // The whole editor state as a saveable document (Export + autosave).
  function currentDocument() {
    return serialize({
      font: tools.font,
      size: grid?.grid.fixed ? { cols: grid.grid.cols, rows: grid.grid.rows } : null,
      guides,
      palette: palette?.getPalette() ?? [],
      cells,
    });
  }

  // Replace the editor state with a document. Returns false if it is invalid.
  // Imports are one undo step; opening a project starts a fresh history.
  function loadDocument(data, { undoable }) {
    let parsed;
    try {
      parsed = deserialize(data);
    } catch {
      return false;
    }
    applyToCells(cells, parsed.cells);
    select?.clear();
    if (undoable) history.commit();
    else history.reset();
    if (parsed.palette) palette?.setPalette(parsed.palette);
    applySize(parsed.size);
    sizeControl?.setValue(parsed.size);
    guideCtl?.set(parsed.guides);
    if (parsed.font) {
      applyFont(parsed.font);
      fontSelector?.setValue(parsed.font);
    }
    grid?.render();
    return true;
  }

  let io = null;
  const ioEl = doc.getElementById('io-controls');
  if (ioEl) {
    io = createIoControls(ioEl, {
      onExport: () => downloadJSON(currentDocument(), 'mockscii.json', doc),
      onImport: (text) => {
        try {
          loadDocument(JSON.parse(text), { undoable: true });
        } catch {
          // ignore invalid files
        }
      },
    });
  }

  // Autosave: the current project is written to localStorage whenever its
  // document changes (polled, so every kind of edit is covered) and when the
  // page is hidden. The last-opened project is reopened on load.
  let storage = null;
  try {
    storage = win.localStorage ?? null;
  } catch {
    storage = null; // blocked site data
  }
  const projects = createProjectStore(storage);
  let projectName = projects.getCurrent();
  let lastSaved = null;

  function autosave() {
    const text = JSON.stringify(currentDocument());
    if (text === lastSaved) return;
    const ok = projects.save(projectName, text);
    if (ok) lastSaved = text;
    projectControl?.setStatus(ok);
  }

  function openProject(name) {
    autosave(); // flush the project being left
    projectName = name;
    projects.setCurrent(name);
    const saved = projects.load(name);
    if (saved) loadDocument(saved, { undoable: false });
    lastSaved = JSON.stringify(currentDocument());
  }

  let projectControl = null;
  const projectEl = doc.getElementById('project-control');
  if (projectEl) {
    projectControl = createProjectControl(projectEl, {
      store: projects,
      initial: projectName,
      onOpen: (name) => openProject(name),
      onRename: (from, to) => {
        autosave();
        projectName = to;
        projects.setCurrent(to);
        lastSaved = null;
        autosave();
        projects.remove(from);
      },
      // New project: empty cells and guides; font, palette and size carry over.
      onNew: (name) => {
        autosave();
        projectName = name;
        projects.setCurrent(name);
        cells.clear();
        select?.clear();
        guideCtl?.set({ v: [], h: [] });
        history.reset();
        lastSaved = null;
        autosave();
      },
    });
  }

  const saved = projects.load(projectName);
  if (saved) loadDocument(saved, { undoable: false });
  lastSaved = saved ? JSON.stringify(currentDocument()) : null;
  if (typeof win.setInterval === 'function') win.setInterval(autosave, 1000);
  win.addEventListener?.('pagehide', autosave);
  doc.addEventListener?.('visibilitychange', () => {
    if (doc.visibilityState === 'hidden') autosave();
  });

  return {
    name: APP_NAME,
    cellKey,
    grid,
    selector,
    toolbar,
    palette,
    fontSelector,
    sizeControl,
    guides,
    guideCtl,
    io,
    projects,
    projectControl,
    autosave,
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
