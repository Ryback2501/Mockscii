import { describe, it, expect, afterEach } from 'vitest';
import { openColorPicker } from '../../src/color-picker.js';

const overlay = () => document.querySelector('[data-testid="color-picker"]');

describe('color picker modal', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a 9x5 preset grid plus the custom colour controls', () => {
    const p = openColorPicker('#000000');
    const o = overlay();
    expect(o.querySelectorAll('.cp-cell')).toHaveLength(45);
    expect(o.querySelector('.cp-color')).toBeTruthy();
    expect(o.querySelector('.cp-hex')).toBeTruthy();
    o.querySelector('.cp-cancel').click();
    return p;
  });

  it('clicking a preset updates the custom controls and Select resolves it', async () => {
    const p = openColorPicker('#000000');
    const o = overlay();
    const cell = o.querySelectorAll('.cp-cell')[10];
    const color = cell.dataset.color;
    cell.click();
    expect(o.querySelector('.cp-hex').value).toBe(color);
    expect(o.querySelector('.cp-color').value).toBe(color);
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

  it('syncs the colour input from the hex field', async () => {
    const p = openColorPicker('#000000');
    const hex = overlay().querySelector('.cp-hex');
    const color = overlay().querySelector('.cp-color');
    hex.value = '#abcdef';
    hex.dispatchEvent(new window.Event('input'));
    expect(color.value).toBe('#abcdef');
    overlay().querySelector('.cp-cancel').click();
    await p;
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
