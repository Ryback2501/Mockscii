// Export / Import controls pinned to the bottom of the side panel. Two icon
// buttons: Export (download) saves the current mockup as JSON; Import (upload)
// opens a hidden file input and hands the chosen file's text to the callback.
import { readFileAsText } from './io.js';

// Inline SVGs (stroke = currentColor) so the icons inherit the button colour.
const EXPORT_ICON =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>';

const IMPORT_ICON =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M12 15V3"/><path d="M7 8l5-5 5 5"/><path d="M5 21h14"/></svg>';

export function createIoControls(container, options = {}) {
  const doc = container.ownerDocument;
  const onExport = options.onExport ?? (() => {});
  const onImport = options.onImport ?? (() => {});

  function iconButton(cls, icon, title) {
    const b = doc.createElement('button');
    b.type = 'button';
    b.className = `io-btn ${cls}`;
    b.title = title;
    b.setAttribute('aria-label', title);
    b.innerHTML = icon;
    return b;
  }

  const exportButton = iconButton('io-export', EXPORT_ICON, 'Export (download JSON)');
  const importButton = iconButton('io-import', IMPORT_ICON, 'Import (load JSON)');

  const input = doc.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.className = 'io-file';
  input.hidden = true;

  exportButton.addEventListener('click', () => onExport());
  importButton.addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const text = await readFileAsText(file);
    input.value = ''; // allow re-importing the same file later
    onImport(text);
  });

  container.replaceChildren(exportButton, importButton, input);

  return { element: container, exportButton, importButton, input };
}
