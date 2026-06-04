import { describe, it, expect } from 'vitest';
import { APP_NAME, cellKey } from '../../src/state.js';

describe('state', () => {
  it('exposes the app name', () => {
    expect(APP_NAME).toBe('Mockscii');
  });

  it('builds a stable cell key', () => {
    expect(cellKey(3, 7)).toBe('3,7');
    expect(cellKey(0, 0)).toBe('0,0');
  });
});
