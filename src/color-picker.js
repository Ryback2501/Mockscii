// A centered modal colour picker modelled on the GTK "Choose a colour" chooser:
// a 9×5 grid of preset colours on top, and below it an inline HSV editor — an
// eyedropper button (when the browser supports the EyeDropper API), a colour
// preview swatch, a hex field, a vertical hue slider and a saturation/value
// square. There is no recents list. openColorPicker(initial) resolves to the
// chosen hex, or null if cancelled.

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

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const toHex2 = (n) =>
  Math.round(Math.max(0, Math.min(255, n)))
    .toString(16)
    .padStart(2, '0');

export function hsvToRgb(h, s, v) {
  h = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

export function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

export function hsvToHex(h, s, v) {
  const { r, g, b } = hsvToRgb(h, s, v);
  return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
}

export function hexToHsv(hex) {
  const n = normalizeHex(hex);
  if (!n) return null;
  return rgbToHsv(
    parseInt(n.slice(1, 3), 16),
    parseInt(n.slice(3, 5), 16),
    parseInt(n.slice(5, 7), 16),
  );
}

/** Saturation/value from a pointer position over the S/V square's rect. */
export function svFromPoint(clientX, clientY, rect) {
  const s = rect.width ? clamp01((clientX - rect.left) / rect.width) : 0;
  const v = rect.height ? clamp01(1 - (clientY - rect.top) / rect.height) : 0;
  return { s, v };
}

/** Hue (0–360) from a pointer position over the hue slider's rect. */
export function hueFromPoint(clientY, rect) {
  const f = rect.height ? clamp01((clientY - rect.top) / rect.height) : 0;
  return f * 360;
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
  { h: 210, s: 0.72 },
  { h: 142, s: 0.55 },
  { h: 50, s: 0.85 },
  { h: 28, s: 0.9 },
  { h: 2, s: 0.72 },
  { h: 288, s: 0.5 },
  { h: 25, s: 0.5 },
  { h: 0, s: 0 },
  { h: 220, s: 0.12 },
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
      if (c === 6) l = LIGHTS[r] * 0.8;
      else if (c === 7) l = NEUTRAL_LIGHT[r];
      else if (c === 8) l = NEUTRAL_DARK[r];
      out.push(hslToHex(col.h, col.s, l));
    }
  }
  return out;
})();

const EYEDROPPER_ICON =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M3 21l4-1 9.5-9.5"/><path d="M14 7l3 3"/><path d="M16 3.5a2.1 2.1 0 0 1 3 3L16.5 9 ' +
  '15 7.5z"/></svg>';

export function openColorPicker(initial = '#ffffff', options = {}) {
  const doc = options.document ?? document;
  const win = options.window ?? doc.defaultView ?? (typeof window !== 'undefined' ? window : null);
  const root = options.root ?? doc.body;
  const start = normalizeHex(initial) ?? '#ffffff';

  return new Promise((resolve) => {
    const el = (tag, cls) => {
      const node = doc.createElement(tag);
      if (cls) node.className = cls;
      return node;
    };
    const textButton = (label, cls) => {
      const b = el('button', cls);
      b.type = 'button';
      b.textContent = label;
      return b;
    };

    const overlay = el('div', 'modal-overlay');
    overlay.dataset.testid = 'color-picker';
    const modal = el('div', 'modal cp-modal');

    // Header: Cancel | "Choose a colour" | Select
    const header = el('div', 'cp-header');
    const cancelBtn = textButton('Cancel', 'cp-cancel');
    const title = el('span', 'cp-title');
    title.textContent = 'Choose a colour';
    const okBtn = textButton('Select', 'cp-ok');
    header.append(cancelBtn, title, okBtn);

    // 9×5 preset grid.
    const table = el('div', 'cp-table');
    const cells = TABLE_COLORS.map((color) => {
      const cell = el('button', 'cp-cell');
      cell.type = 'button';
      cell.style.background = color;
      cell.dataset.color = color;
      cell.title = color;
      cell.setAttribute('aria-label', color);
      cell.addEventListener('click', () => setHex(color));
      table.appendChild(cell);
      return cell;
    });

    const customLabel = el('div', 'cp-custom-label');
    customLabel.textContent = 'Custom';

    // Top row: eyedropper (if supported) + preview + hex.
    const top = el('div', 'cp-top');
    let eyedropBtn = null;
    if (win && typeof win.EyeDropper === 'function') {
      eyedropBtn = el('button', 'cp-eyedrop');
      eyedropBtn.type = 'button';
      eyedropBtn.title = 'Pick a colour from the screen';
      eyedropBtn.setAttribute('aria-label', 'Pick a colour from the screen');
      eyedropBtn.innerHTML = EYEDROPPER_ICON;
      eyedropBtn.addEventListener('click', async () => {
        try {
          const res = await new win.EyeDropper().open();
          if (res && res.sRGBHex) setHex(res.sRGBHex);
        } catch {
          /* user dismissed the eyedropper */
        }
      });
      top.appendChild(eyedropBtn);
    }
    const preview = el('div', 'cp-preview');
    const hexInput = el('input', 'cp-hex');
    hexInput.type = 'text';
    top.append(preview, hexInput);

    // Body: hue slider + S/V square.
    const body = el('div', 'cp-body');
    const hue = el('div', 'cp-hue');
    const hueThumb = el('div', 'cp-hue-thumb');
    hue.appendChild(hueThumb);
    const sv = el('div', 'cp-sv');
    const svThumb = el('div', 'cp-sv-thumb');
    sv.appendChild(svThumb);
    body.append(hue, sv);

    // ---- State ----------------------------------------------------------
    let state = hexToHsv(start) ?? { h: 0, s: 0, v: 1 };

    const currentHex = () => hsvToHex(state.h, state.s, state.v);

    function highlight(hex) {
      const v = normalizeHex(hex);
      for (const cell of cells) cell.classList.toggle('selected', cell.dataset.color === v);
    }

    // `shownHex` lets a preset/typed colour display its exact hex while the HSV
    // state (which can round-trip differently) only drives the sliders.
    function apply(shownHex, { skipHex = false } = {}) {
      const hex = shownHex ?? currentHex();
      preview.style.backgroundColor = hex;
      if (!skipHex) hexInput.value = hex;
      sv.style.background =
        `linear-gradient(to bottom, transparent, #000), ` +
        `linear-gradient(to right, #fff, transparent), hsl(${state.h}, 100%, 50%)`;
      svThumb.style.left = `${state.s * 100}%`;
      svThumb.style.top = `${(1 - state.v) * 100}%`;
      hueThumb.style.top = `${(state.h / 360) * 100}%`;
      highlight(hex);
    }

    function setHsv(h, s, v) {
      state = { h, s, v };
      apply(); // dragging -> show the round-tripped hex
    }
    function setHex(hex, opts) {
      const hsv = hexToHsv(hex);
      if (hsv) {
        state = hsv;
        apply(normalizeHex(hex), opts); // show the exact hex
      }
    }

    // ---- Interactions ---------------------------------------------------
    hexInput.addEventListener('input', () => {
      if (normalizeHex(hexInput.value)) setHex(hexInput.value, { skipHex: true });
    });

    let dragging = null; // 'sv' | 'hue' | null
    const pickSv = (ev) => {
      const { s, v } = svFromPoint(ev.clientX, ev.clientY, sv.getBoundingClientRect());
      setHsv(state.h, s, v);
    };
    const pickHue = (ev) => {
      setHsv(hueFromPoint(ev.clientY, hue.getBoundingClientRect()), state.s, state.v);
    };
    sv.addEventListener('mousedown', (ev) => {
      ev.preventDefault();
      dragging = 'sv';
      pickSv(ev);
    });
    hue.addEventListener('mousedown', (ev) => {
      ev.preventDefault();
      dragging = 'hue';
      pickHue(ev);
    });
    const onMove = (ev) => {
      if (dragging === 'sv') pickSv(ev);
      else if (dragging === 'hue') pickHue(ev);
    };
    const onUp = () => {
      dragging = null;
    };
    win?.addEventListener('mousemove', onMove);
    win?.addEventListener('mouseup', onUp);

    // ---- Close ----------------------------------------------------------
    function close(value) {
      doc.removeEventListener('keydown', onKey);
      win?.removeEventListener('mousemove', onMove);
      win?.removeEventListener('mouseup', onUp);
      overlay.remove();
      resolve(value);
    }
    function onKey(e) {
      if (e.key === 'Escape') close(null);
    }
    okBtn.addEventListener('click', () => close(normalizeHex(hexInput.value) ?? currentHex()));
    cancelBtn.addEventListener('click', () => close(null));
    overlay.addEventListener('mousedown', (e) => {
      if (e.target === overlay) close(null);
    });
    doc.addEventListener('keydown', onKey);

    modal.append(header, table, customLabel, top, body);
    overlay.append(modal);
    root.append(overlay);

    setHex(start); // seed preview/hex/thumbs and highlight a matching preset
    hexInput.focus?.();
  });
}
