// The glyph palette offered by the selector, grouped by category. Beyond
// printable ASCII it covers the Unicode blocks that modern terminal UIs lean on
// — box drawing, block elements, geometric shapes, arrows, braille (spinners /
// plots), plus curated punctuation, technical/keyboard, and status symbols, then
// the full symbol blocks (misc symbols, dingbats, math, misc technical).
//
// Every glyph is one terminal cell wide: code points that terminals render
// double-width (East Asian Width W/F per Unicode 16 — chiefly default-emoji
// symbols, but also e.g. the ☰ trigrams) and unassigned code points are excluded
// from the block ranges below, since the editor draws every glyph in one cell.
//
// Note: Nerd Font / Powerline private-use icons are intentionally omitted —
// they only render with a patched font, which this app does not load.

import { GLYPH_NAMES } from './glyph-names.js';

function rangeChars(start, end, exclude = []) {
  const skip = new Set(exclude);
  const out = [];
  for (let code = start; code <= end; code++) {
    if (!skip.has(code)) out.push(String.fromCodePoint(code));
  }
  return out;
}

// Inclusive code-point runs, for compact exclusion lists.
function runs(...pairs) {
  const out = [];
  for (const [a, b = a] of pairs) for (let c = a; c <= b; c++) out.push(c);
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
  { label: 'Geometric shapes', chars: rangeChars(0x25a0, 0x25ff, runs([0x25fd, 0x25fe])) },
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
    chars: [...'★☆✦✧✓✔✗✘✕✖☐☑☒⚠⚙⚑⚐⎈➜➤➔➞❯❮❱❰⮕'],
  },
  {
    label: 'Misc symbols',
    chars: rangeChars(
      0x2600,
      0x26ff,
      runs(
        [0x2614, 0x2615],
        [0x2630, 0x2637],
        [0x2648, 0x2653],
        [0x267f],
        [0x268a, 0x268f],
        [0x2693],
        [0x26a1],
        [0x26aa, 0x26ab],
        [0x26bd, 0x26be],
        [0x26c4, 0x26c5],
        [0x26ce],
        [0x26d4],
        [0x26ea],
        [0x26f2, 0x26f3],
        [0x26f5],
        [0x26fa],
        [0x26fd],
      ),
    ),
  },
  {
    label: 'Dingbats',
    chars: rangeChars(
      0x2700,
      0x27bf,
      runs(
        [0x2705],
        [0x270a, 0x270b],
        [0x2728],
        [0x274c],
        [0x274e],
        [0x2753, 0x2755],
        [0x2757],
        [0x2795, 0x2797],
        [0x27b0],
        [0x27bf],
      ),
    ),
  },
  { label: 'Math operators', chars: rangeChars(0x2200, 0x22ff) },
  {
    label: 'Misc technical',
    chars: rangeChars(
      0x2300,
      0x23ff,
      runs([0x231a, 0x231b], [0x2329, 0x232a], [0x23e9, 0x23ec], [0x23f0], [0x23f3]),
    ),
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

/** "Black heart suit · U+2665" — the Unicode name when known, plus the code point. */
export function describeGlyph(ch) {
  const name = GLYPH_NAMES[ch];
  return name ? `${name} · ${codePointLabel(ch)}` : codePointLabel(ch);
}
