import { describe, it, expect, beforeEach } from 'vitest';
import { createToolbar } from '../../src/toolbar.js';

function makeTools() {
  return { glyph: '#', fg: '#d4d4d4', bg: null, mode: 'draw', activeChannel: 'fg' };
}

describe('toolbar', () => {
  let container, tools;

  beforeEach(() => {
    document.body.innerHTML = '<div id="toolbar"></div>';
    container = document.getElementById('toolbar');
    tools = makeTools();
  });

  it('renders the select, fg, and bg buttons', () => {
    const tb = createToolbar(container, { tools });
    expect(container.querySelectorAll('button.tool')).toHaveLength(3);
    expect(tb.selectButton.textContent).toBe('↑');
    expect(tb.fgButton.textContent).toBe('A');
  });

  it('starts in draw mode with the fg channel active', () => {
    const tb = createToolbar(container, { tools });
    expect(tb.selectButton.classList.contains('active')).toBe(false);
    expect(tb.fgButton.classList.contains('channel-active')).toBe(true);
    expect(tb.bgButton.classList.contains('channel-active')).toBe(false);
    expect(tb.bgButton.textContent).toBe('□'); // no background set yet
  });

  it('toggles select mode and notifies', () => {
    const modes = [];
    const tb = createToolbar(container, { tools, onModeChange: (m) => modes.push(m) });
    tb.selectButton.click();
    expect(tools.mode).toBe('select');
    expect(tb.selectButton.classList.contains('active')).toBe(true);
    tb.selectButton.click();
    expect(tools.mode).toBe('draw');
    expect(modes).toEqual(['select', 'draw']);
  });

  it('switches the active colour channel and notifies', () => {
    const channels = [];
    const tb = createToolbar(container, { tools, onChannelChange: (c) => channels.push(c) });
    tb.bgButton.click();
    expect(tools.activeChannel).toBe('bg');
    expect(tb.bgButton.classList.contains('channel-active')).toBe(true);
    expect(tb.fgButton.classList.contains('channel-active')).toBe(false);
    tb.fgButton.click();
    expect(tools.activeChannel).toBe('fg');
    expect(channels).toEqual(['bg', 'fg']);
  });

  it('shows current colours and refreshes on external change', () => {
    const tb = createToolbar(container, { tools });
    expect(tb.fgButton.style.color).toBe('rgb(212, 212, 212)');
    tools.bg = '#ff0000';
    tb.refresh();
    expect(tb.bgButton.textContent).toBe('■');
    expect(tb.bgButton.style.color).toBe('rgb(255, 0, 0)');
  });
});
