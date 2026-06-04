// Font selector: a labelled dropdown of the predefined monospace fonts. The
// chosen font-family stack is reported via onChange and applied globally.
import { FONT_OPTIONS, DEFAULT_FONT } from './fonts.js';

export function createFontSelector(container, options = {}) {
  const doc = container.ownerDocument;
  const onChange = options.onChange ?? (() => {});
  const fonts = options.fonts ?? FONT_OPTIONS;

  const label = doc.createElement('label');
  label.className = 'font-label';
  label.textContent = 'Font';
  label.setAttribute('for', 'font-select');

  const select = doc.createElement('select');
  select.id = 'font-select';
  select.className = 'font-select';
  for (const f of fonts) {
    const opt = doc.createElement('option');
    opt.value = f.value;
    opt.textContent = f.label;
    select.appendChild(opt);
  }
  select.value = options.initial ?? DEFAULT_FONT;

  select.addEventListener('change', () => onChange(select.value));

  container.replaceChildren(label, select);

  return {
    element: container,
    select,
    getValue: () => select.value,
    setValue: (v) => {
      select.value = v;
    },
  };
}
