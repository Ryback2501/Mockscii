// Top-bar toolbar: a tool group (draw / erase / fill / select, with more tools
// added in later PRs) that sets the active `tools.tool`, the foreground (A) and
// background (■) colour-channel buttons, and undo / redo / clear actions.
import { DEFAULT_FG } from './palette.js';
import { ICONS, iconButton } from './icons.js';

// The mutually-exclusive pointer tools, in display order. `icon` ones use an
// SVG; `label` ones use text. Each gets a `tool-<name>` class.
const TOOL_DEFS = [
  { tool: 'draw', icon: ICONS.pencil, title: 'Draw' },
  { tool: 'erase', icon: ICONS.eraser, title: 'Erase' },
  { tool: 'fill', icon: ICONS.bucket, title: 'Fill' },
  { tool: 'line', icon: ICONS.line, title: 'Line' },
  { tool: 'rect', icon: ICONS.rect, title: 'Rectangle' },
  { tool: 'text', icon: ICONS.text, title: 'Type text' },
  { tool: 'select', label: '↑', title: 'Select' },
];

export function createToolbar(container, options = {}) {
  const doc = container.ownerDocument;
  const tools = options.tools;
  const onToolChange = options.onToolChange ?? (() => {});
  const onChannelChange = options.onChannelChange ?? (() => {});
  // tools.fg / tools.bg hold palette colour ids; resolve them for display.
  const colorOf = options.colorOf ?? (() => undefined);
  // Optional undo/redo history (exposes canUndo/canRedo + undo/redo).
  const history = options.history ?? null;
  const onUndo = options.onUndo ?? (() => {});
  const onRedo = options.onRedo ?? (() => {});
  const onClear = options.onClear ?? (() => {});

  function button(label, cls, title) {
    const b = doc.createElement('button');
    b.type = 'button';
    b.className = `tool ${cls}`;
    b.textContent = label;
    b.title = title;
    return b;
  }

  // Pointer-tool radio group.
  const toolButtons = TOOL_DEFS.map((def) => {
    const el = def.icon
      ? iconButton(doc, `tool tool-${def.tool}`, def.icon, def.title)
      : button(def.label, `tool-${def.tool}`, def.title);
    el.addEventListener('click', () => {
      tools.tool = def.tool;
      refresh();
      onToolChange(def.tool);
    });
    return { tool: def.tool, el };
  });

  const fgBtn = button('A', 'tool-fg', 'Foreground colour');
  const bgBtn = button('■', 'tool-bg', 'Background colour');
  const undoBtn = iconButton(doc, 'tool tool-undo', ICONS.undo, 'Undo (Ctrl+Z)');
  const redoBtn = iconButton(doc, 'tool tool-redo', ICONS.redo, 'Redo (Ctrl+Y)');
  const clearBtn = iconButton(doc, 'tool tool-clear', ICONS.clear, 'Clear the canvas');

  function refresh() {
    const active = tools.tool ?? 'draw';
    for (const t of toolButtons) {
      const on = t.tool === active;
      t.el.classList.toggle('active', on);
      t.el.setAttribute('aria-pressed', String(on));
    }

    const fgColor = colorOf(tools.fg) ?? DEFAULT_FG;
    const bgColor = colorOf(tools.bg);
    fgBtn.style.color = fgColor || 'inherit';
    fgBtn.classList.toggle('channel-active', tools.activeChannel === 'fg');

    bgBtn.textContent = bgColor ? '■' : '□';
    bgBtn.style.color = bgColor || 'inherit';
    bgBtn.classList.toggle('channel-active', tools.activeChannel === 'bg');

    if (history) {
      undoBtn.disabled = !history.canUndo();
      redoBtn.disabled = !history.canRedo();
    }
  }

  fgBtn.addEventListener('click', () => {
    tools.activeChannel = 'fg';
    refresh();
    onChannelChange('fg');
  });
  bgBtn.addEventListener('click', () => {
    tools.activeChannel = 'bg';
    refresh();
    onChannelChange('bg');
  });
  undoBtn.addEventListener('click', () => {
    onUndo();
    refresh();
  });
  redoBtn.addEventListener('click', () => {
    onRedo();
    refresh();
  });
  clearBtn.addEventListener('click', () => {
    onClear();
    refresh();
  });

  const byTool = (name) => toolButtons.find((t) => t.tool === name)?.el;
  container.replaceChildren(
    ...toolButtons.map((t) => t.el),
    fgBtn,
    bgBtn,
    undoBtn,
    redoBtn,
    clearBtn,
  );
  refresh();

  return {
    element: container,
    refresh,
    toolButton: byTool,
    selectButton: byTool('select'),
    drawButton: byTool('draw'),
    eraseButton: byTool('erase'),
    fillButton: byTool('fill'),
    lineButton: byTool('line'),
    rectButton: byTool('rect'),
    textButton: byTool('text'),
    fgButton: fgBtn,
    bgButton: bgBtn,
    undoButton: undoBtn,
    redoButton: redoBtn,
    clearButton: clearBtn,
  };
}
