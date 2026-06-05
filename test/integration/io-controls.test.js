import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createIoControls } from '../../src/io-controls.js';
import { downloadJSON } from '../../src/io.js';

describe('io controls', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = '<div id="io-controls"></div>';
    container = document.getElementById('io-controls');
  });

  it('renders icon Export/Import buttons and a hidden file input', () => {
    const io = createIoControls(container, {});
    expect(io.exportButton).toBeTruthy();
    expect(io.importButton).toBeTruthy();
    expect(io.input.type).toBe('file');
    expect(io.input.hidden).toBe(true);
    // Icon buttons: SVG content, accessible label, no visible text.
    expect(io.exportButton.querySelector('svg')).toBeTruthy();
    expect(io.exportButton.getAttribute('aria-label')).toMatch(/export/i);
    expect(io.importButton.querySelector('svg')).toBeTruthy();
  });

  it('calls onExport when the Export button is clicked', () => {
    const onExport = vi.fn();
    const io = createIoControls(container, { onExport });
    io.exportButton.click();
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('triggers the hidden input when the Import button is clicked', () => {
    const io = createIoControls(container, {});
    const spy = vi.spyOn(io.input, 'click');
    io.importButton.click();
    expect(spy).toHaveBeenCalled();
  });

  it('reads the chosen file and hands its text to onImport', async () => {
    const onImport = vi.fn();
    const io = createIoControls(container, { onImport });

    const file = new File(['{"hello":1}'], 'mock.json', { type: 'application/json' });
    Object.defineProperty(io.input, 'files', { value: [file], configurable: true });
    io.input.dispatchEvent(new window.Event('change'));

    await vi.waitFor(() => expect(onImport).toHaveBeenCalledWith('{"hello":1}'));
  });
});

describe('downloadJSON', () => {
  it('creates an object URL and clicks a temporary anchor', () => {
    const createObjectURL = vi.fn(() => 'blob:fake');
    const revokeObjectURL = vi.fn();
    const realURL = window.URL;
    window.URL = { ...realURL, createObjectURL, revokeObjectURL };

    const clicks = [];
    const origClick = window.HTMLAnchorElement.prototype.click;
    window.HTMLAnchorElement.prototype.click = function () {
      clicks.push({ href: this.href, download: this.download });
    };

    try {
      downloadJSON({ a: 1 }, 'out.json', document);
      expect(createObjectURL).toHaveBeenCalled();
      expect(clicks).toHaveLength(1);
      expect(clicks[0].download).toBe('out.json');
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');
      expect(document.querySelector('a[download]')).toBeNull(); // anchor removed
    } finally {
      window.HTMLAnchorElement.prototype.click = origClick;
      window.URL = realURL;
    }
  });
});
