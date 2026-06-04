import { describe, it, expect, beforeEach } from 'vitest';
import { createPalette } from '../../src/palette.js';

function makeTools() {
  return { fg: '#d4d4d4', bg: null, activeChannel: 'fg' };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('palette control', () => {
  let container, tools;

  beforeEach(() => {
    document.body.innerHTML = '<div id="palette"></div>';
    container = document.getElementById('palette');
    tools = makeTools();
  });

  it('renders swatches plus add/remove controls', () => {
    const p = createPalette(container, { tools, colors: ['#111111', '#222222'] });
    expect(container.querySelectorAll('button.swatch')).toHaveLength(2);
    expect(container.querySelector('.palette-add')).toBeTruthy();
    expect(container.querySelector('.palette-remove')).toBeTruthy();
    expect(p.getSelected()).toBe(0);
  });

  it('assigns a clicked swatch to the active foreground channel', () => {
    const assigns = [];
    const p = createPalette(container, {
      tools,
      colors: ['#111111', '#222222', '#333333'],
      onAssign: (ch, c) => assigns.push([ch, c]),
    });
    container.querySelectorAll('button.swatch')[2].click();
    expect(p.getSelected()).toBe(2);
    expect(tools.fg).toBe('#333333');
    expect(assigns).toContainEqual(['fg', '#333333']);
  });

  it('assigns to the background channel when it is active', () => {
    tools.activeChannel = 'bg';
    createPalette(container, { tools, colors: ['#111111', '#222222'] });
    container.querySelectorAll('button.swatch')[1].click();
    expect(tools.bg).toBe('#222222');
    expect(tools.fg).toBe('#d4d4d4'); // foreground untouched
  });

  it('adds a colour via the picker and selects it', async () => {
    const p = createPalette(container, {
      tools,
      colors: ['#111111'],
      openColorPicker: async () => '#abcdef',
    });
    await p.add();
    expect(p.getColors()).toEqual(['#111111', '#abcdef']);
    expect(p.getSelected()).toBe(1);
    expect(tools.fg).toBe('#abcdef');
  });

  it('does not add when the picker is cancelled', async () => {
    const p = createPalette(container, {
      tools,
      colors: ['#111111'],
      openColorPicker: async () => null,
    });
    await p.add();
    expect(p.getColors()).toEqual(['#111111']);
  });

  it('removes the selected colour and falls back to the first', () => {
    const p = createPalette(container, { tools, colors: ['#111111', '#222222', '#333333'] });
    p.selectIndex(2);
    p.remove();
    expect(p.getColors()).toEqual(['#111111', '#222222']);
    expect(p.getSelected()).toBe(0);
    expect(tools.fg).toBe('#111111');
  });

  it('keeps at least one colour', () => {
    const p = createPalette(container, { tools, colors: ['#111111'] });
    p.remove();
    expect(p.getColors()).toEqual(['#111111']);
  });

  it('edits a swatch on double-click via the picker', async () => {
    const p = createPalette(container, {
      tools,
      colors: ['#111111', '#222222'],
      openColorPicker: async () => '#0a0b0c',
    });
    container
      .querySelectorAll('button.swatch')[1]
      .dispatchEvent(new window.MouseEvent('dblclick', { bubbles: true }));
    await flush();
    expect(p.getColors()[1]).toBe('#0a0b0c');
  });
});
