import { describe, it, expect, afterEach } from 'vitest';
import { openColorPicker } from '../../src/color-picker.js';

const overlay = () => document.querySelector('[data-testid="color-picker"]');

describe('color picker modal', () => {
  afterEach(() => {
    document.body.innerHTML = '';
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
