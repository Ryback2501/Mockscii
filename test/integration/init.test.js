import { describe, it, expect, beforeEach } from 'vitest';
import { init } from '../../src/main.js';

describe('init (integration)', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <main id="app">
        <section id="grid-area"><canvas id="grid"></canvas></section>
        <aside id="side-panel"></aside>
      </main>`;
  });

  it('wires up the app and returns the public surface', () => {
    const api = init(document);
    expect(api.name).toBe('Mockscii');
    expect(api.cellKey(1, 2)).toBe('1,2');
  });

  it('gives the canvas a non-zero size', () => {
    init(document);
    const canvas = document.getElementById('grid');
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
  });
});
