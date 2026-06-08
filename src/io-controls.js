// Export / Import controls pinned to the bottom of the side panel. Two icon
// buttons: Export (download) saves the current mockup as JSON; Import (upload)
// opens a hidden file input and hands the chosen file's text to the callback.
import { readFileAsText } from './io.js';
import { ICONS, iconButton } from './icons.js';

export function createIoControls(container, options = {}) {
  const doc = container.ownerDocument;
  const onExport = options.onExport ?? (() => {});
  const onImport = options.onImport ?? (() => {});

  const exportButton = iconButton(doc, 'io-btn io-export', ICONS.export, 'Export (download JSON)');
  const importButton = iconButton(doc, 'io-btn io-import', ICONS.import, 'Import (load JSON)');

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
