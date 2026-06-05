import { describe, it, expect, beforeEach } from 'vitest';
import { createPalette } from '../../src/palette.js';

function makeTools() {
  return { fg: null, bg: null, activeChannel: 'fg' };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('palette control', () => {
  let container, tools;

  beforeEach(() => {
    document.body.innerHTML = '<div id="palette"></div>';
    container = document.getElementById('palette');
    tools = makeTools();
  });

  it('renders swatches plus add/remove controls, nothing selected initially', () => {
    const p = createPalette(container, { tools, colors: ['#111111', '#222222'] });
    expect(container.querySelectorAll('button.swatch')).toHaveLength(2);
    expect(container.querySelector('.palette-add')).toBeTruthy();
    expect(container.querySelector('.palette-remove')).toBeTruthy();
    expect(p.getSelected()).toBeNull();
    expect(tools.fg).toBeNull();
    expect(container.querySelectorAll('.swatch.selected')).toHaveLength(0);
  });

  it('stores the colour id on the channel and resolves it via colorOf', () => {
    const p = createPalette(container, { tools, colors: ['#111111', '#222222'] });
    const sw = container.querySelectorAll('button.swatch');
    sw[1].click();
    const id = p.getSelected();
    expect(id).not.toBeNull();
    expect(tools.fg).toBe(id);
    expect(p.colorOf(id)).toBe('#222222');
  });

  it('deselects when the selected swatch is clicked again, reverting to no id', () => {
    const p = createPalette(container, { tools, colors: ['#111111', '#222222'] });
    const sw = container.querySelectorAll('button.swatch');
    sw[1].click();
    expect(p.colorOf(tools.fg)).toBe('#222222');

    sw[1].click(); // click the selected swatch again -> deselect
    expect(p.getSelected()).toBeNull();
    expect(tools.fg).toBeNull(); // falls back to the default at render time
    expect(container.querySelectorAll('.swatch.selected')).toHaveLength(0);
  });

  it('tracks foreground and background selections independently', () => {
    const p = createPalette(container, { tools, colors: ['#111111', '#222222', '#333333'] });
    container.querySelectorAll('.swatch')[1].click(); // fg -> #222
    const fgId = tools.fg;
    expect(p.colorOf(fgId)).toBe('#222222');

    tools.activeChannel = 'bg';
    p.refresh();
    container.querySelectorAll('.swatch')[2].click(); // bg -> #333
    expect(p.colorOf(tools.bg)).toBe('#333333');
    expect(tools.fg).toBe(fgId); // fg untouched

    const bgIdx = [...container.querySelectorAll('.swatch')].findIndex((s) =>
      s.classList.contains('selected'),
    );
    expect(bgIdx).toBe(2);

    tools.activeChannel = 'fg';
    p.refresh();
    const fgIdx = [...container.querySelectorAll('.swatch')].findIndex((s) =>
      s.classList.contains('selected'),
    );
    expect(fgIdx).toBe(1);
  });

  it('deselecting the background reverts it to no background', () => {
    tools.activeChannel = 'bg';
    const p = createPalette(container, { tools, colors: ['#111111'] });
    const sw = container.querySelector('.swatch');
    sw.click();
    expect(p.colorOf(tools.bg)).toBe('#111111');
    sw.click();
    expect(tools.bg).toBeNull();
  });

  it('assigns a clicked swatch id to the active foreground channel', () => {
    const assigns = [];
    const p = createPalette(container, {
      tools,
      colors: ['#111111', '#222222', '#333333'],
      onAssign: (ch, id) => assigns.push([ch, id]),
    });
    container.querySelectorAll('button.swatch')[2].click();
    const id = p.getSelected();
    expect(tools.fg).toBe(id);
    expect(p.colorOf(id)).toBe('#333333');
    expect(assigns).toContainEqual(['fg', id]);
  });

  it('assigns to the background channel when it is active', () => {
    tools.activeChannel = 'bg';
    const p = createPalette(container, { tools, colors: ['#111111', '#222222'] });
    container.querySelectorAll('button.swatch')[1].click();
    expect(p.colorOf(tools.bg)).toBe('#222222');
    expect(tools.fg).toBeNull(); // foreground untouched
  });

  it('adds a colour via the picker and selects it', async () => {
    const p = createPalette(container, {
      tools,
      colors: ['#111111'],
      openColorPicker: async () => '#abcdef',
    });
    await p.add();
    expect(p.getColors()).toEqual(['#111111', '#abcdef']);
    expect(p.colorOf(p.getSelected())).toBe('#abcdef');
    expect(p.colorOf(tools.fg)).toBe('#abcdef');
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

  it('removes the selected colour and falls back to the default (no selection)', () => {
    const p = createPalette(container, { tools, colors: ['#111111', '#222222', '#333333'] });
    p.selectIndex(2);
    expect(p.colorOf(tools.fg)).toBe('#333333');
    p.remove();
    expect(p.getColors()).toEqual(['#111111', '#222222']);
    expect(p.getSelected()).toBeNull();
    expect(tools.fg).toBeNull();
  });

  it('keeps stable ids when a colour is removed', () => {
    const p = createPalette(container, { tools, colors: ['#111111', '#222222', '#333333'] });
    const ids = p.getPalette().map((e) => e.id);
    p.selectIndex(0); // select #111111
    const firstId = p.getSelected();
    tools.activeChannel = 'bg';
    p.refresh();
    p.selectIndex(2); // remove the third colour from the bg channel
    p.remove();
    // The first colour kept its id; the fg channel still references it.
    expect(p.colorOf(firstId)).toBe('#111111');
    expect(p.getPalette().map((e) => e.id)).toEqual(ids.slice(0, 2));
  });

  it('keeps at least one colour', () => {
    const p = createPalette(container, { tools, colors: ['#111111'] });
    p.selectIndex(0);
    p.remove();
    expect(p.getColors()).toEqual(['#111111']);
  });

  it('edits a swatch on double-click, keeping its id so references follow', async () => {
    const p = createPalette(container, {
      tools,
      colors: ['#111111', '#222222'],
      openColorPicker: async () => '#0a0b0c',
    });
    const id = p.getPalette()[1].id;
    container
      .querySelectorAll('button.swatch')[1]
      .dispatchEvent(new window.MouseEvent('dblclick', { bubbles: true }));
    await flush();
    expect(p.colorOf(id)).toBe('#0a0b0c');
  });
});
