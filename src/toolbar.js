// Toolbar above the glyph selector: a select-mode toggle (↑) plus the
// foreground (A) and background (■) colour-channel buttons. Each colour button
// shows its current colour and marks which channel is "active" — the channel
// that palette picks (a later task) will assign to.

import { DEFAULT_FG } from './palette.js';

export function createToolbar(container, options = {}) {
  const doc = container.ownerDocument;
  const tools = options.tools;
  const onModeChange = options.onModeChange ?? (() => {});
  const onChannelChange = options.onChannelChange ?? (() => {});
  // tools.fg / tools.bg hold palette colour ids; resolve them for display.
  const colorOf = options.colorOf ?? (() => undefined);

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

  container.replaceChildren(selectBtn, fgBtn, bgBtn);
  refresh();

  return {
    element: container,
    refresh,
    selectButton: selectBtn,
    fgButton: fgBtn,
    bgButton: bgBtn,
  };
}
