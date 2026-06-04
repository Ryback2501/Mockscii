// Predefined monospace fonts common across the major desktop operating systems.
// Each value is a CSS font-family stack ending in `monospace`, so an unavailable
// font falls back to the system monospace face.

export const FONT_OPTIONS = [
  { label: 'System monospace', value: 'monospace' },
  { label: 'Consolas (Windows)', value: 'Consolas, monospace' },
  { label: 'Cascadia Mono (Windows)', value: "'Cascadia Mono', 'Cascadia Code', monospace" },
  { label: 'Courier New (Windows)', value: "'Courier New', monospace" },
  { label: 'Lucida Console (Windows)', value: "'Lucida Console', monospace" },
  { label: 'Menlo (macOS)', value: 'Menlo, monospace' },
  { label: 'Monaco (macOS)', value: 'Monaco, monospace' },
  { label: 'SF Mono (macOS)', value: "'SF Mono', 'SFMono-Regular', monospace" },
  { label: 'DejaVu Sans Mono (Linux)', value: "'DejaVu Sans Mono', monospace" },
  { label: 'Liberation Mono (Linux)', value: "'Liberation Mono', monospace" },
  { label: 'Ubuntu Mono (Linux)', value: "'Ubuntu Mono', monospace" },
  { label: 'Noto Sans Mono (Linux)', value: "'Noto Sans Mono', monospace" },
  { label: 'Source Code Pro', value: "'Source Code Pro', monospace" },
  { label: 'Fira Code', value: "'Fira Code', 'Fira Mono', monospace" },
  { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
];

/** Default selection — the generic system monospace. */
export const DEFAULT_FONT = FONT_OPTIONS[0].value;
