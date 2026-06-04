// Palette control: a row of colour swatches plus + / − buttons. Clicking a
// swatch selects it and assigns its colour to the active channel (tools.fg or
// tools.bg). Double-click edits a swatch; + adds a colour; − removes the
// selected one and falls back to the first. Add/edit use the colour-picker modal.
import { openColorPicker } from './color-picker.js';

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

  const colors = [...(options.colors ?? DEFAULT_COLORS)];
  let selected = 0;

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

  function assignActive(color) {
    const channel = tools.activeChannel === 'bg' ? 'bg' : 'fg';
    tools[channel] = color;
    onAssign(channel, color);
  }

  function render() {
    swatches.replaceChildren();
    colors.forEach((color, i) => {
      const sw = doc.createElement('button');
      sw.type = 'button';
      sw.className = i === selected ? 'swatch selected' : 'swatch';
      sw.style.background = color;
      sw.title = color;
      sw.setAttribute('aria-label', color);
      sw.addEventListener('click', () => selectSwatch(i));
      sw.addEventListener('dblclick', () => editSwatch(i));
      swatches.appendChild(sw);
    });
  }

  function selectSwatch(i) {
    selected = i;
    render();
    assignActive(colors[i]);
  }

  async function editSwatch(i) {
    const next = await pick(colors[i], pickOptions);
    if (!next) return;
    colors[i] = next;
    render();
    if (i === selected) assignActive(next);
  }

  async function addColor() {
    const next = await pick(colors[selected] ?? '#ffffff', pickOptions);
    if (!next) return;
    colors.push(next);
    selected = colors.length - 1;
    render();
    assignActive(next);
  }

  function removeColor() {
    if (colors.length <= 1) return; // always keep at least one colour
    colors.splice(selected, 1);
    selected = 0;
    render();
    assignActive(colors[selected]);
  }

  addBtn.addEventListener('click', addColor);
  removeBtn.addEventListener('click', removeColor);

  container.replaceChildren(swatches, controls);
  render();

  return {
    element: container,
    getColors: () => [...colors],
    getSelected: () => selected,
    getSelectedColor: () => colors[selected],
    add: addColor,
    remove: removeColor,
    selectIndex: selectSwatch,
  };
}
