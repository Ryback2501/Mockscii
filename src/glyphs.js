// The glyph palette offered by the selector: printable ASCII plus the
// box-drawing, block, and arrow characters most useful for terminal mockups.

function rangeChars(start, end) {
  const out = [];
  for (let code = start; code <= end; code++) out.push(String.fromCodePoint(code));
  return out;
}

export const GLYPH_GROUPS = [
  { label: 'ASCII', chars: rangeChars(0x21, 0x7e) },
  { label: 'Box drawing', chars: [...'─│┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬╭╮╰╯'] },
  { label: 'Blocks', chars: [...'█▉▊▋▌▍▎▏▀▄▐░▒▓▖▗▘▝▙▚▛▜▞▟'] },
  { label: 'Arrows', chars: [...'←↑→↓↔↕↖↗↘↙'] },
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
