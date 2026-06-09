// A centered modal colour picker modelled on the GTK "Choose a colour" chooser:
// a 9×5 grid of preset colours on top, with the custom colour controls (native
// <input type="color"> + hex field) below it. Clicking a preset updates the
// custom controls. There is no recents / "custom colours" list.
// openColorPicker(initial) resolves to the chosen hex, or null if cancelled.

/** Normalize user input to a `#rrggbb` lowercase hex, or null if invalid. */
export function normalizeHex(input) {
  if (typeof input !== 'string') return null;
  let v = input.trim().toLowerCase();
  if (!v.startsWith('#')) v = `#${v}`;
  if (/^#[0-9a-f]{3}$/.test(v)) {
    v = `#${[...v.slice(1)].map((c) => c + c).join('')}`;
  }
  return /^#[0-9a-f]{6}$/.test(v) ? v : null;
}

function hslToHex(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// 9 columns (7 hues + 2 neutrals) × 5 lightness rows, light at the top.
const COLUMNS = [
  { h: 210, s: 0.72 }, // blue
  { h: 142, s: 0.55 }, // green
  { h: 50, s: 0.85 }, // yellow
  { h: 28, s: 0.9 }, // orange
  { h: 2, s: 0.72 }, // red
  { h: 288, s: 0.5 }, // purple
  { h: 25, s: 0.5 }, // brown
  { h: 0, s: 0 }, // light neutral
  { h: 220, s: 0.12 }, // dark neutral
];
const LIGHTS = [0.74, 0.6, 0.5, 0.4, 0.3];
const NEUTRAL_LIGHT = [0.97, 0.85, 0.72, 0.55, 0.4];
const NEUTRAL_DARK = [0.5, 0.38, 0.27, 0.16, 0.05];

/** The fixed 9×5 preset colour table (row-major, 45 entries). */
export const TABLE_COLORS = (() => {
  const out = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < COLUMNS.length; c++) {
      const col = COLUMNS[c];
      let l = LIGHTS[r];
      if (c === 6)
        l = LIGHTS[r] * 0.8; // brown reads darker
      else if (c === 7) l = NEUTRAL_LIGHT[r];
      else if (c === 8) l = NEUTRAL_DARK[r];
      out.push(hslToHex(col.h, col.s, l));
    }
  }
  return out;
})();

export function openColorPicker(initial = '#ffffff', options = {}) {
  const doc = options.document ?? document;
  const root = options.root ?? doc.body;
  const start = normalizeHex(initial) ?? '#ffffff';

  return new Promise((resolve) => {
    const overlay = doc.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.dataset.testid = 'color-picker';

    const modal = doc.createElement('div');
    modal.className = 'modal cp-modal';

    const button = (label, cls) => {
      const b = doc.createElement('button');
      b.type = 'button';
      b.className = cls;
      b.textContent = label;
      return b;
    };

    // Header: Cancel | "Choose a colour" | Select
    const header = doc.createElement('div');
    header.className = 'cp-header';
    const cancelBtn = button('Cancel', 'cp-cancel');
    const title = doc.createElement('span');
    title.className = 'cp-title';
    title.textContent = 'Choose a colour';
    const okBtn = button('Select', 'cp-ok');
    header.append(cancelBtn, title, okBtn);

    // 9×5 preset grid.
    const table = doc.createElement('div');
    table.className = 'cp-table';
    const cells = TABLE_COLORS.map((color) => {
      const cell = doc.createElement('button');
      cell.type = 'button';
      cell.className = 'cp-cell';
      cell.style.background = color;
      cell.dataset.color = color;
      cell.title = color;
      cell.setAttribute('aria-label', color);
      cell.addEventListener('click', () => pickPreset(color));
      table.appendChild(cell);
      return cell;
    });

    // Custom controls.
    const customLabel = doc.createElement('div');
    customLabel.className = 'cp-custom-label';
    customLabel.textContent = 'Custom';

    const colorInput = doc.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'cp-color';
    colorInput.value = start;

    const hexInput = doc.createElement('input');
    hexInput.type = 'text';
    hexInput.className = 'cp-hex';
    hexInput.value = start;

    const row = doc.createElement('div');
    row.className = 'cp-row';
    row.append(colorInput, hexInput);

    function highlight(value) {
      const v = normalizeHex(value);
      for (const cell of cells) cell.classList.toggle('selected', cell.dataset.color === v);
    }

    // Clicking a preset fills the custom controls (single source of truth: hex).
    function pickPreset(color) {
      colorInput.value = color;
      hexInput.value = color;
      highlight(color);
    }

    colorInput.addEventListener('input', () => {
      hexInput.value = colorInput.value;
      highlight(colorInput.value);
    });
    hexInput.addEventListener('input', () => {
      const v = normalizeHex(hexInput.value);
      if (v) {
        colorInput.value = v;
        highlight(v);
      }
    });

    function close(value) {
      doc.removeEventListener('keydown', onKey);
      overlay.remove();
      resolve(value);
    }
    function onKey(e) {
      if (e.key === 'Escape') close(null);
    }

    okBtn.addEventListener('click', () => close(normalizeHex(hexInput.value) ?? colorInput.value));
    cancelBtn.addEventListener('click', () => close(null));
    overlay.addEventListener('mousedown', (e) => {
      if (e.target === overlay) close(null);
    });
    doc.addEventListener('keydown', onKey);

    modal.append(header, table, customLabel, row);
    overlay.append(modal);
    root.append(overlay);

    highlight(start); // pre-select a matching preset, if any
    colorInput.focus?.();
  });
}
