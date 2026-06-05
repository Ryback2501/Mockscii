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

export const FONT_CATALOG = [
  { label: 'System monospace', value: 'monospace', family: 'monospace', type: 'generic' },

  // Web fonts (Google Fonts) — always available online.
  {
    label: 'JetBrains Mono',
    value: "'JetBrains Mono', monospace",
    family: 'JetBrains Mono',
    type: 'web',
  },
  { label: 'Fira Code', value: "'Fira Code', monospace", family: 'Fira Code', type: 'web' },
  {
    label: 'Source Code Pro',
    value: "'Source Code Pro', monospace",
    family: 'Source Code Pro',
    type: 'web',
  },
  { label: 'Roboto Mono', value: "'Roboto Mono', monospace", family: 'Roboto Mono', type: 'web' },
  { label: 'Ubuntu Mono', value: "'Ubuntu Mono', monospace", family: 'Ubuntu Mono', type: 'web' },
  {
    label: 'IBM Plex Mono',
    value: "'IBM Plex Mono', monospace",
    family: 'IBM Plex Mono',
    type: 'web',
  },
  { label: 'Inconsolata', value: "'Inconsolata', monospace", family: 'Inconsolata', type: 'web' },
  { label: 'Space Mono', value: "'Space Mono', monospace", family: 'Space Mono', type: 'web' },

  // System fonts — shown only when installed.
  { label: 'Consolas (Windows)', value: 'Consolas, monospace', family: 'Consolas', type: 'system' },
  {
    label: 'Cascadia Mono (Windows)',
    value: "'Cascadia Mono', monospace",
    family: 'Cascadia Mono',
    type: 'system',
  },
  {
    label: 'Courier New (Windows)',
    value: "'Courier New', monospace",
    family: 'Courier New',
    type: 'system',
  },
  {
    label: 'Lucida Console (Windows)',
    value: "'Lucida Console', monospace",
    family: 'Lucida Console',
    type: 'system',
  },
  { label: 'Menlo (macOS)', value: 'Menlo, monospace', family: 'Menlo', type: 'system' },
  { label: 'Monaco (macOS)', value: 'Monaco, monospace', family: 'Monaco', type: 'system' },
  { label: 'SF Mono (macOS)', value: "'SF Mono', monospace", family: 'SF Mono', type: 'system' },
  {
    label: 'DejaVu Sans Mono (Linux)',
    value: "'DejaVu Sans Mono', monospace",
    family: 'DejaVu Sans Mono',
    type: 'system',
  },
  {
    label: 'Liberation Mono (Linux)',
    value: "'Liberation Mono', monospace",
    family: 'Liberation Mono',
    type: 'system',
  },
];

/** Default selection — the generic system monospace. */
export const DEFAULT_FONT = 'monospace';

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
