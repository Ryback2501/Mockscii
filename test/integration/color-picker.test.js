import { describe, it, expect, afterEach } from 'vitest';
import { openColorPicker } from '../../src/color-picker.js';

const overlay = () => document.querySelector('[data-testid="color-picker"]');

describe('color picker modal', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the preset grid plus the inline HSV controls', () => {
    const p = openColorPicker('#000000');
    const o = overlay();
    expect(o.querySelectorAll('.cp-cell')).toHaveLength(45);
    expect(o.querySelector('.cp-preview')).toBeTruthy();
    expect(o.querySelector('.cp-hex')).toBeTruthy();
    expect(o.querySelector('.cp-hue')).toBeTruthy();
    expect(o.querySelector('.cp-sv')).toBeTruthy();
    // The preview is a plain div, not an input that opens the OS picker.
    expect(o.querySelector('.cp-preview').tagName).toBe('DIV');
    o.querySelector('.cp-cancel').click();
    return p;
  });

  it('clicking a preset updates the preview/hex and Select resolves it', async () => {
    const p = openColorPicker('#000000');
    const o = overlay();
    const cell = o.querySelectorAll('.cp-cell')[10];
    const color = cell.dataset.color;
    cell.click();
    expect(o.querySelector('.cp-hex').value).toBe(color);
    expect(cell.classList.contains('selected')).toBe(true);
    o.querySelector('.cp-ok').click();
    await expect(p).resolves.toBe(color);
  });

  it('resolves with the chosen hex on OK', async () => {
    const p = openColorPicker('#000000');
    const hex = overlay().querySelector('.cp-hex');
    hex.value = '#ff8800';
    hex.dispatchEvent(new window.Event('input'));
    overlay().querySelector('.cp-ok').click();
    await expect(p).resolves.toBe('#ff8800');
    expect(overlay()).toBeNull();
  });

  it('updates the preview swatch from the hex field', async () => {
    const p = openColorPicker('#000000');
    const hex = overlay().querySelector('.cp-hex');
    const preview = overlay().querySelector('.cp-preview');
    hex.value = '#abcdef';
    hex.dispatchEvent(new window.Event('input'));
    expect(preview.style.backgroundColor).toBe('rgb(171, 205, 239)');
    overlay().querySelector('.cp-cancel').click();
    await p;
  });

  it('shows the eyedropper button only when the EyeDropper API exists', async () => {
    const original = window.EyeDropper;
    window.EyeDropper = function EyeDropper() {};
    const p1 = openColorPicker('#000000');
    expect(overlay().querySelector('.cp-eyedrop')).toBeTruthy();
    overlay().querySelector('.cp-cancel').click();
    await p1;

    delete window.EyeDropper;
    const p2 = openColorPicker('#000000');
    expect(overlay().querySelector('.cp-eyedrop')).toBeNull();
    overlay().querySelector('.cp-cancel').click();
    await p2;
    if (original) window.EyeDropper = original;
  });

  it('resolves null on cancel', async () => {
    const p = openColorPicker('#123456');
    overlay().querySelector('.cp-cancel').click();
    await expect(p).resolves.toBeNull();
    expect(overlay()).toBeNull();
  });

  it('resolves null on Escape', async () => {
    const p = openColorPicker('#123456');
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
    await expect(p).resolves.toBeNull();
  });
});
