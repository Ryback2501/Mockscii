// Palette control: a row of colour swatches plus + / − buttons.
//
// Colours live ONLY in the palette. Each entry has a stable numeric `id` that
// never changes for the life of that colour, plus its current `color`. Tool
// channels (foreground / background) and painted cells reference a colour by
// its id — never by a raw hex string — so editing a palette colour updates
// every cell using it, and removing a colour leaves references dangling so they
// resolve back to the default (foreground -> DEFAULT_FG, background -> none).
//
// Each colour channel tracks its own selected id independently. Clicking a
// swatch assigns its id to the *active* channel; clicking that channel's
// already-selected swatch deselects it (id -> null -> default). Double-click
// edits a swatch; + adds a colour; − removes the selected one.
import { openColorPicker } from './color-picker.js';
import { ICONS, iconButton } from './icons.js';

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
  const onChannelChange = options.onChannelChange ?? (() => {});
  const pick = options.openColorPicker ?? openColorPicker;
  const pickOptions = { document: doc, root: options.modalRoot ?? doc.body };
  const defaults = { fg: DEFAULT_FG, bg: DEFAULT_BG, ...(options.defaults ?? {}) };

  // Stable ids: monotonic, never reused. Entries are { id, color }.
  let nextId = 1;
  let entries = [...(options.colors ?? DEFAULT_COLORS)].map((color) => ({ id: nextId++, color }));
  // Selected colour *id* per channel, or null when nothing is selected.
  const selection = { fg: null, bg: null };

  // Foreground / background channel buttons, on the left of the palette.
  const channels = doc.createElement('div');
  channels.className = 'palette-channels';
  const fgBtn = doc.createElement('button');
  fgBtn.type = 'button';
  fgBtn.className = 'palette-channel channel-fg';
  fgBtn.textContent = 'A';
  fgBtn.title = 'Foreground colour';
  const bgBtn = doc.createElement('button');
  bgBtn.type = 'button';
  bgBtn.className = 'palette-channel channel-bg';
  bgBtn.textContent = '■';
  bgBtn.title = 'Background colour';
  channels.append(fgBtn, bgBtn);

  const swatches = doc.createElement('div');
  swatches.className = 'palette-swatches';

  const controls = doc.createElement('div');
  controls.className = 'palette-controls';
  const addBtn = iconButton(doc, 'palette-btn palette-add', ICONS.plus, 'Add colour');
  const editBtn = iconButton(doc, 'palette-btn palette-edit', ICONS.pencil, 'Edit selected colour');
  const removeBtn = iconButton(
    doc,
    'palette-btn palette-remove',
    ICONS.trash,
    'Remove selected colour',
  );
  controls.append(addBtn, editBtn, removeBtn);

  const activeChannel = () => (tools.activeChannel === 'bg' ? 'bg' : 'fg');
  const entryById = (id) => (id == null ? undefined : entries.find((e) => e.id === id));
  const colorOf = (id) => entryById(id)?.color;
  const colorFor = (ch) => colorOf(selection[ch]) ?? defaults[ch];

  function applyChannel(ch) {
    tools[ch] = selection[ch]; // store the id (or null), not a raw colour
    onAssign(ch, selection[ch]);
  }

  function render() {
    const sel = selection[activeChannel()];
    swatches.replaceChildren();
    entries.forEach((entry) => {
      const sw = doc.createElement('button');
      sw.type = 'button';
      sw.className = entry.id === sel ? 'swatch selected' : 'swatch';
      sw.style.background = entry.color;
      sw.title = entry.color;
      sw.setAttribute('aria-label', entry.color);
      sw.addEventListener('click', () => toggleSwatch(entry.id));
      sw.addEventListener('dblclick', () => editSwatch(entry.id));
      swatches.appendChild(sw);
    });
    // Edit and remove act on the active channel's selected swatch.
    const hasSelection = sel != null;
    editBtn.disabled = !hasSelection;
    removeBtn.disabled = !hasSelection;

    // Reflect each channel's colour and which one is active.
    fgBtn.style.color = colorFor('fg') || 'inherit';
    fgBtn.classList.toggle('active', activeChannel() === 'fg');
    const bgColor = colorOf(selection.bg);
    bgBtn.textContent = bgColor ? '■' : '□';
    bgBtn.style.color = bgColor || 'inherit';
    bgBtn.classList.toggle('active', activeChannel() === 'bg');
  }

  function selectChannel(ch) {
    tools.activeChannel = ch;
    render();
    onChannelChange(ch);
  }

  // Edit the active channel's currently selected colour (used by the pencil button).
  function editSelected() {
    return editSwatch(selection[activeChannel()]);
  }

  function toggleSwatch(id) {
    const ch = activeChannel();
    selection[ch] = selection[ch] === id ? null : id; // click selected -> deselect
    render();
    applyChannel(ch);
  }

  function selectIndex(i) {
    const ch = activeChannel();
    selection[ch] = entries[i]?.id ?? null;
    render();
    applyChannel(ch);
  }

  async function editSwatch(id) {
    const entry = entryById(id);
    if (!entry) return;
    const next = await pick(entry.color, pickOptions);
    if (!next) return;
    entry.color = next; // same id -> every referencing cell updates on render
    render();
    // Re-broadcast so any selection recolour reflects the new value.
    for (const ch of ['fg', 'bg']) {
      if (selection[ch] === id) applyChannel(ch);
    }
  }

  async function addColor() {
    const ch = activeChannel();
    const start = colorFor(ch) ?? '#ffffff';
    const next = await pick(start, pickOptions);
    if (!next) return;
    const entry = { id: nextId++, color: next };
    entries.push(entry);
    selection[ch] = entry.id;
    render();
    applyChannel(ch);
  }

  function removeColor() {
    if (entries.length <= 1) return; // always keep at least one colour
    const ch = activeChannel();
    const id = selection[ch];
    if (id == null) return; // nothing selected to remove
    entries = entries.filter((e) => e.id !== id);
    // Any channel referencing the removed id falls back to its default.
    for (const c of ['fg', 'bg']) {
      if (selection[c] === id) selection[c] = null;
    }
    render();
    applyChannel('fg');
    applyChannel('bg');
  }

  function setColors(newColors) {
    const list = Array.isArray(newColors) && newColors.length ? newColors : DEFAULT_COLORS;
    entries = list.map((color) => ({ id: nextId++, color }));
    selection.fg = null;
    selection.bg = null;
    render();
    applyChannel('fg');
    applyChannel('bg');
  }

  // Restore palette entries with their original ids (used by Import) so any
  // cell that references an id still resolves to the right colour.
  function setPalette(newEntries) {
    const list = Array.isArray(newEntries)
      ? newEntries.filter((e) => e && Number.isInteger(e.id) && typeof e.color === 'string')
      : [];
    entries = list.length
      ? list.map((e) => ({ id: e.id, color: e.color }))
      : DEFAULT_COLORS.map((color) => ({ id: nextId++, color }));
    // Keep ids monotonic so later adds never collide with restored ones.
    nextId = Math.max(nextId, ...entries.map((e) => e.id + 1));
    selection.fg = null;
    selection.bg = null;
    render();
    applyChannel('fg');
    applyChannel('bg');
  }

  addBtn.addEventListener('click', addColor);
  editBtn.addEventListener('click', editSelected);
  removeBtn.addEventListener('click', removeColor);
  fgBtn.addEventListener('click', () => selectChannel('fg'));
  bgBtn.addEventListener('click', () => selectChannel('bg'));

  // Reflect the (initially empty) channel selections into tools, then render.
  tools.fg = selection.fg;
  tools.bg = selection.bg;
  container.replaceChildren(channels, swatches, controls);
  render();

  return {
    element: container,
    refresh: render,
    colorOf,
    getPalette: () => entries.map((e) => ({ ...e })),
    getColors: () => entries.map((e) => e.color),
    setColors,
    setPalette,
    getSelected: () => selection[activeChannel()],
    getSelectedColor: () => colorFor(activeChannel()),
    add: addColor,
    edit: editSelected,
    remove: removeColor,
    selectIndex,
    fgButton: fgBtn,
    bgButton: bgBtn,
  };
}
