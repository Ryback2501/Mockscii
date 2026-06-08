// Monospace font catalog.
//
// - `generic` : the system monospace — always available.
// - `web`     : loaded online from Google Fonts (see index.html) — always
//               offered, usable on any OS without installing anything.
// - `system`  : proprietary / OS-bundled faces — offered only when the user
//               actually has them installed (detected at runtime).
//
// Each `value` is a CSS font-family stack ending in `monospace`; `family` is the
// primary face name, used for installed-detection and document.fonts.load().
//
// `size` is the font's default render size in CSS px. Monospace faces have
// different optical sizes at the same pixel size, so each carries a size tuned
// to look balanced against the generic reference — there is no user size picker
// yet, so this is simply how big each font prints.
import { DEFAULT_FONT_SIZE } from './state.js';

export const FONT_CATALOG = [
  { label: 'System monospace', value: 'monospace', family: 'monospace', type: 'generic', size: 16 },

  // Web fonts (Google Fonts) — always available online.
  {
    label: 'JetBrains Mono',
    value: "'JetBrains Mono', monospace",
    family: 'JetBrains Mono',
    type: 'web',
    size: 15,
  },
  {
    label: 'Fira Code',
    value: "'Fira Code', monospace",
    family: 'Fira Code',
    type: 'web',
    size: 16,
  },
  {
    label: 'Source Code Pro',
    value: "'Source Code Pro', monospace",
    family: 'Source Code Pro',
    type: 'web',
    size: 16,
  },
  {
    label: 'Roboto Mono',
    value: "'Roboto Mono', monospace",
    family: 'Roboto Mono',
    type: 'web',
    size: 16,
  },
  {
    label: 'Ubuntu Mono',
    value: "'Ubuntu Mono', monospace",
    family: 'Ubuntu Mono',
    type: 'web',
    size: 18,
  },
  {
    label: 'IBM Plex Mono',
    value: "'IBM Plex Mono', monospace",
    family: 'IBM Plex Mono',
    type: 'web',
    size: 16,
  },
  {
    label: 'Inconsolata',
    value: "'Inconsolata', monospace",
    family: 'Inconsolata',
    type: 'web',
    size: 18,
  },
  {
    label: 'Space Mono',
    value: "'Space Mono', monospace",
    family: 'Space Mono',
    type: 'web',
    size: 15,
  },

  // System fonts — shown only when installed.
  {
    label: 'Consolas (Windows)',
    value: 'Consolas, monospace',
    family: 'Consolas',
    type: 'system',
    size: 16,
  },
  {
    label: 'Cascadia Mono (Windows)',
    value: "'Cascadia Mono', monospace",
    family: 'Cascadia Mono',
    type: 'system',
    size: 16,
  },
  {
    label: 'Courier New (Windows)',
    value: "'Courier New', monospace",
    family: 'Courier New',
    type: 'system',
    size: 17,
  },
  {
    label: 'Lucida Console (Windows)',
    value: "'Lucida Console', monospace",
    family: 'Lucida Console',
    type: 'system',
    size: 15,
  },
  { label: 'Menlo (macOS)', value: 'Menlo, monospace', family: 'Menlo', type: 'system', size: 15 },
  {
    label: 'Monaco (macOS)',
    value: 'Monaco, monospace',
    family: 'Monaco',
    type: 'system',
    size: 15,
  },
  {
    label: 'SF Mono (macOS)',
    value: "'SF Mono', monospace",
    family: 'SF Mono',
    type: 'system',
    size: 15,
  },
  {
    label: 'DejaVu Sans Mono (Linux)',
    value: "'DejaVu Sans Mono', monospace",
    family: 'DejaVu Sans Mono',
    type: 'system',
    size: 16,
  },
  {
    label: 'Liberation Mono (Linux)',
    value: "'Liberation Mono', monospace",
    family: 'Liberation Mono',
    type: 'system',
    size: 16,
  },
];

/** Default selection — the generic system monospace. */
export const DEFAULT_FONT = 'monospace';

/** The default render size (CSS px) for a font `value`, else the global default. */
export function fontSizeFor(value, fallback = DEFAULT_FONT_SIZE) {
  const entry = FONT_CATALOG.find((f) => f.value === value);
  return entry && typeof entry.size === 'number' ? entry.size : fallback;
}

/** Web-font families requested from Google Fonts (kept in sync with index.html). */
export const WEB_FONT_FAMILIES = FONT_CATALOG.filter((f) => f.type === 'web').map((f) => f.family);

/**
 * Heuristic check for whether a font is available to the page: render a sample
 * string in `"<family>", monospace` and compare its width to plain `monospace`.
 * A different width means the named face actually rendered (installed/loaded).
 */
export function isFontInstalled(family, doc) {
  const d = doc ?? (typeof document !== 'undefined' ? document : null);
  if (!d) return false;
  const canvas = d.createElement('canvas');
  const ctx = canvas.getContext && canvas.getContext('2d');
  if (!ctx) return false;
  const sample = 'mmmmmmmmmmlli WWWiii09';
  const size = '72px';
  ctx.font = `${size} monospace`;
  const base = ctx.measureText(sample).width;
  ctx.font = `${size} "${family}", monospace`;
  return ctx.measureText(sample).width !== base;
}

/**
 * The fonts to offer in the selector: generic + web always, system only when
 * available. `isAvailable` is injectable for testing.
 */
export function getAvailableFonts(options = {}) {
  const isAvailable =
    options.isAvailable ?? ((family) => isFontInstalled(family, options.document));
  return FONT_CATALOG.filter((f) => f.type !== 'system' || isAvailable(f.family));
}
