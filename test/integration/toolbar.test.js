import { describe, it, expect, beforeEach } from 'vitest';
import { createToolbar } from '../../src/toolbar.js';

function makeTools() {
  return { glyph: '#', fg: null, bg: null, tool: 'draw', activeChannel: 'fg' };
}

describe('toolbar', () => {
  let container, tools;

  beforeEach(() => {
    document.body.innerHTML = '<div id="toolbar"></div>';
    container = document.getElementById('toolbar');
    tools = makeTools();
  });

  it('renders the tool group plus undo/redo and clear buttons', () => {
    const tb = createToolbar(container, { tools });
    // draw, erase, fill, line, rect, text, select, undo, redo, clear
    expect(container.querySelectorAll('button.tool')).toHaveLength(10);
    expect(tb.selectButton.textContent).toBe('↑');
    for (const cls of [
      '.tool-draw',
      '.tool-erase',
      '.tool-fill',
      '.tool-line',
      '.tool-rect',
      '.tool-text',
      '.tool-select',
      '.tool-undo',
      '.tool-redo',
      '.tool-clear',
    ]) {
      expect(container.querySelector(cls)).toBeTruthy();
    }
    // The colour-channel buttons no longer live in the toolbar.
    expect(container.querySelector('.tool-fg')).toBeNull();
    expect(container.querySelector('.tool-bg')).toBeNull();
  });

  it('fires onClear when the clear button is clicked', () => {
    let cleared = 0;
    const tb = createToolbar(container, { tools, onClear: () => (cleared += 1) });
    tb.clearButton.click();
    expect(cleared).toBe(1);
  });

  it('reflects undo/redo availability from the history', () => {
    let undoable = false;
    const history = { canUndo: () => undoable, canRedo: () => false };
    const tb = createToolbar(container, { tools, history });
    expect(tb.undoButton.disabled).toBe(true);
    expect(tb.redoButton.disabled).toBe(true);
    undoable = true;
    tb.refresh();
    expect(tb.undoButton.disabled).toBe(false);
  });

  it('starts with the draw tool active', () => {
    const tb = createToolbar(container, { tools });
    expect(tb.drawButton.classList.contains('active')).toBe(true);
    expect(tb.selectButton.classList.contains('active')).toBe(false);
  });

  it('selects a tool (radio) and notifies', () => {
    const picked = [];
    const tb = createToolbar(container, { tools, onToolChange: (t) => picked.push(t) });
    tb.selectButton.click();
    expect(tools.tool).toBe('select');
    expect(tb.selectButton.classList.contains('active')).toBe(true);
    expect(tb.drawButton.classList.contains('active')).toBe(false);
    tb.fillButton.click();
    expect(tools.tool).toBe('fill');
    expect(tb.fillButton.classList.contains('active')).toBe(true);
    expect(tb.selectButton.classList.contains('active')).toBe(false);
    expect(picked).toEqual(['select', 'fill']);
  });
});
