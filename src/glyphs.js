// The glyph palette offered by the selector, grouped by category. Beyond
// printable ASCII it covers the Unicode blocks that modern terminal UIs lean on
// — box drawing, block elements, geometric shapes, arrows, braille (spinners /
// plots), plus curated punctuation, technical/keyboard, and status symbols.
//
// Note: Nerd Font / Powerline private-use icons are intentionally omitted —
// they only render with a patched font, which this app does not load.

function rangeChars(start, end) {
  const out = [];
  for (let code = start; code <= end; code++) out.push(String.fromCodePoint(code));
  return out;
}

export const GLYPH_GROUPS = [
  { label: 'ASCII', chars: rangeChars(0x21, 0x7e) },
  {
    label: 'Punctuation & symbols',
    chars: [...'¡¿«»‹›„“”‚‘’–—‐•‣◦·…‰′″⁄†‡§¶©®™°±×÷¬µ№¢£¥€¤'],
  },
  { label: 'Box drawing', chars: rangeChars(0x2500, 0x257f) },
  { label: 'Block elements', chars: rangeChars(0x2580, 0x259f) },
  { label: 'Geometric shapes', chars: rangeChars(0x25a0, 0x25ff) },
  { label: 'Arrows', chars: rangeChars(0x2190, 0x21ff) },
  { label: 'Braille', chars: rangeChars(0x2800, 0x28ff) },
  {
    // Keyboard and media keys that render as monochrome text glyphs. Clock /
    // timer code points (⌚⏰⏱⏲⏳) are excluded — they default to colour emoji.
    label: 'Technical & keys',
    chars: [...'⌘⌥⌃⌫⌦⏎⎋⏏⏯⏸⏹⏺⏭⏮⏵⏴'],
  },
  {
    label: 'Status & dingbats',
    chars: [...'★☆✦✧✓✔✗✘✕✖☐☑☒⚠⚡⚙⚑⚐⎈➜➤➔➞❯❮❱❰⮕'],
  },
];

/** Default glyph painted before the user picks one. */
export const DEFAULT_GLYPH = '█';

/** Flat, de-duplicated list of every glyph across all groups (order preserved). */
export function allGlyphs() {
  const seen = new Set();
  const out = [];
  for (const group of GLYPH_GROUPS) {
    for (const ch of group.chars) {
      if (!seen.has(ch)) {
        seen.add(ch);
        out.push(ch);
      }
    }
  }
  return out;
}

/** "U+00A7"-style label for a single-character glyph. */
export function codePointLabel(ch) {
  return `U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`;
}
