// Palette control: a row of colour swatches plus + / − buttons.
//
// Each colour channel (foreground / background) tracks its own selected swatch
// independently. Clicking a swatch assigns its colour to the *active* channel;
// clicking that channel's already-selected swatch deselects it, so the channel
// falls back to its default (foreground -> DEFAULT_FG, background -> DEFAULT_BG).
// Double-click edits a swatch; + adds a colour; − removes the selected one and
// falls back to the first. Add/edit use the colour-picker modal.
import { openColorPicker } from './color-picker.js';

export const DEFAULT_FG = '#d4d4d4';
export const DEFAULT_BG = null; // no background

export const DEFAULT_COLORS = [
  '#d4d4d4',
  '#ffffff',
  '#000000',
  '#ff5555',
  '#50fa7b',
  '#8be9fd',
  '#bd93f9',
  '#f1fa8c',
];

export function createPalette(container, options = {}) {
  const doc = container.ownerDocument;
  const tools = options.tools;
  const onAssign = options.onAssign ?? (() => {});
  const pick = options.openColorPicker ?? openColorPicker;
  const pickOptions = { document: doc, root: options.modalRoot ?? doc.body };
  const defaults = { fg: DEFAULT_FG, bg: DEFAULT_BG, ...(options.defaults ?? {}) };

  const colors = [...(options.colors ?? DEFAULT_COLORS)];
  // Selected swatch index per channel, or null when nothing is selected.
  const selection = { fg: null, bg: null };

  function controlButton(label, cls, title) {
    const b = doc.createElement('button');
    b.type = 'button';
    b.className = `palette-btn ${cls}`;
    b.textContent = label;
    b.title = title;
    return b;
  }

  const swatches = doc.createElement('div');
  swatches.className = 'palette-swatches';

  const controls = doc.createElement('div');
  controls.className = 'palette-controls';
  const addBtn = controlButton('+', 'palette-add', 'Add colour');
  const removeBtn = controlButton('−', 'palette-remove', 'Remove selected colour');
  controls.append(addBtn, removeBtn);

  const activeChannel = () => (tools.activeChannel === 'bg' ? 'bg' : 'fg');
  const colorFor = (ch) => (selection[ch] == null ? defaults[ch] : colors[selection[ch]]);

  function applyChannel(ch) {
    tools[ch] = colorFor(ch);
    onAssign(ch, tools[ch]);
  }

  function render() {
    const sel = selection[activeChannel()];
    swatches.replaceChildren();
    colors.forEach((color, i) => {
      const sw = doc.createElement('button');
      sw.type = 'button';
      sw.className = i === sel ? 'swatch selected' : 'swatch';
      sw.style.background = color;
      sw.title = color;
      sw.setAttribute('aria-label', color);
      sw.addEventListener('click', () => toggleSwatch(i));
      sw.addEventListener('dblclick', () => editSwatch(i));
      swatches.appendChild(sw);
    });
  }

  function toggleSwatch(i) {
    const ch = activeChannel();
    selection[ch] = selection[ch] === i ? null : i; // click selected -> deselect
    render();
    applyChannel(ch);
  }

  function selectIndex(i) {
    const ch = activeChannel();
    selection[ch] = i;
    render();
    applyChannel(ch);
  }

  async function editSwatch(i) {
    const next = await pick(colors[i], pickOptions);
    if (!next) return;
    colors[i] = next;
    render();
    for (const ch of ['fg', 'bg']) {
      if (selection[ch] === i) applyChannel(ch);
    }
  }

  async function addColor() {
    const ch = activeChannel();
    const start = selection[ch] != null ? colors[selection[ch]] : (tools[ch] ?? '#ffffff');
    const next = await pick(start, pickOptions);
    if (!next) return;
    colors.push(next);
    selection[ch] = colors.length - 1;
    render();
    applyChannel(ch);
  }

  function removeColor() {
    if (colors.length <= 1) return; // always keep at least one colour
    const ch = activeChannel();
    const idx = selection[ch];
    if (idx == null) return; // nothing selected to remove
    colors.splice(idx, 1);
    for (const c of ['fg', 'bg']) {
      if (selection[c] == null) continue;
      if (selection[c] === idx) selection[c] = null;
      else if (selection[c] > idx) selection[c] -= 1;
    }
    selection[ch] = 0; // fall back to the first colour
    render();
    applyChannel('fg');
    applyChannel('bg');
  }

  addBtn.addEventListener('click', addColor);
  removeBtn.addEventListener('click', removeColor);

  // Reflect the (initially default) channel colours into tools, then render.
  tools.fg = colorFor('fg');
  tools.bg = colorFor('bg');
  container.replaceChildren(swatches, controls);
  render();

  return {
    element: container,
    refresh: render,
    getColors: () => [...colors],
    getSelected: () => selection[activeChannel()],
    getSelectedColor: () => colorFor(activeChannel()),
    add: addColor,
    remove: removeColor,
    selectIndex,
  };
}
