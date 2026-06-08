// Toolbar above the glyph selector: a select-mode toggle (↑) plus the
// foreground (A) and background (■) colour-channel buttons. Each colour button
// shows its current colour and marks which channel is "active" — the channel
// that palette picks (a later task) will assign to.

import { DEFAULT_FG } from './palette.js';
import { ICONS, iconButton } from './icons.js';

export function createToolbar(container, options = {}) {
  const doc = container.ownerDocument;
  const tools = options.tools;
  const onModeChange = options.onModeChange ?? (() => {});
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

  const selectBtn = button('↑', 'tool-select', 'Toggle selection mode');
  const fgBtn = button('A', 'tool-fg', 'Foreground colour');
  const bgBtn = button('■', 'tool-bg', 'Background colour');
  const undoBtn = iconButton(doc, 'tool tool-undo', ICONS.undo, 'Undo (Ctrl+Z)');
  const redoBtn = iconButton(doc, 'tool tool-redo', ICONS.redo, 'Redo (Ctrl+Y)');
  const clearBtn = iconButton(doc, 'tool tool-clear', ICONS.clear, 'Clear the canvas');

  function refresh() {
    const selecting = tools.mode === 'select';
    selectBtn.classList.toggle('active', selecting);
    selectBtn.setAttribute('aria-pressed', String(selecting));

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

  selectBtn.addEventListener('click', () => {
    tools.mode = tools.mode === 'select' ? 'draw' : 'select';
    refresh();
    onModeChange(tools.mode);
  });
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

  container.replaceChildren(selectBtn, fgBtn, bgBtn, undoBtn, redoBtn, clearBtn);
  refresh();

  return {
    element: container,
    refresh,
    selectButton: selectBtn,
    undoButton: undoBtn,
    redoButton: redoBtn,
    clearButton: clearBtn,
    fgButton: fgBtn,
    bgButton: bgBtn,
  };
}
