// A small modal color picker built on the native <input type="color"> plus a
// hex text field. openColorPicker(initial) resolves to the chosen hex, or null
// if the user cancels (Cancel button, overlay click, or Escape).

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

export function openColorPicker(initial = '#ffffff', options = {}) {
  const doc = options.document ?? document;
  const root = options.root ?? doc.body;
  const start = normalizeHex(initial) ?? '#ffffff';

  return new Promise((resolve) => {
    const overlay = doc.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.dataset.testid = 'color-picker';

    const modal = doc.createElement('div');
    modal.className = 'modal';

    const colorInput = doc.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'cp-color';
    colorInput.value = start;

    const hexInput = doc.createElement('input');
    hexInput.type = 'text';
    hexInput.className = 'cp-hex';
    hexInput.value = start;

    colorInput.addEventListener('input', () => {
      hexInput.value = colorInput.value;
    });
    hexInput.addEventListener('input', () => {
      const v = normalizeHex(hexInput.value);
      if (v) colorInput.value = v;
    });

    const okBtn = doc.createElement('button');
    okBtn.type = 'button';
    okBtn.className = 'cp-ok';
    okBtn.textContent = 'OK';

    const cancelBtn = doc.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'cp-cancel';
    cancelBtn.textContent = 'Cancel';

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

    const row = doc.createElement('div');
    row.className = 'cp-row';
    row.append(colorInput, hexInput);

    const actions = doc.createElement('div');
    actions.className = 'cp-actions';
    actions.append(cancelBtn, okBtn);

    modal.append(row, actions);
    overlay.append(modal);
    root.append(overlay);
    colorInput.focus?.();
  });
}
