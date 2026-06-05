// Geometric rendering of the Unicode Block Elements (U+2580–U+259F). Drawing
// these as filled rectangles (instead of font glyphs) makes them tile
// pixel-perfectly and look identical on every font.
//
// blockSpec(ch) -> { rects: [[fx, fy, fw, fh], ...], alpha? } | null
// Coordinates are fractions of the cell (0..1). `alpha` (for shades) scales the
// fill opacity. Returns null when `ch` is not a block element.

const Q_UL = [0, 0, 0.5, 0.5];
const Q_UR = [0.5, 0, 0.5, 0.5];
const Q_LL = [0, 0.5, 0.5, 0.5];
const Q_LR = [0.5, 0.5, 0.5, 0.5];

const e = (n) => n / 8;

export function blockSpec(ch) {
  if (!ch) return null;
  const cp = ch.codePointAt(0);
  if (cp < 0x2580 || cp > 0x259f) return null;

  switch (cp) {
    case 0x2588:
      return { rects: [[0, 0, 1, 1]] }; // █ full block
    case 0x2580:
      return { rects: [[0, 0, 1, 0.5]] }; // ▀ upper half
    case 0x2584:
      return { rects: [[0, 0.5, 1, 0.5]] }; // ▄ lower half
    case 0x258c:
      return { rects: [[0, 0, 0.5, 1]] }; // ▌ left half
    case 0x2590:
      return { rects: [[0.5, 0, 0.5, 1]] }; // ▐ right half
    case 0x2594:
      return { rects: [[0, 0, 1, e(1)]] }; // ▔ upper one-eighth
    case 0x2595:
      return { rects: [[e(7), 0, e(1), 1]] }; // ▕ right one-eighth
    case 0x2591:
      return { rects: [[0, 0, 1, 1]], alpha: 0.25 }; // ░ light shade
    case 0x2592:
      return { rects: [[0, 0, 1, 1]], alpha: 0.5 }; // ▒ medium shade
    case 0x2593:
      return { rects: [[0, 0, 1, 1]], alpha: 0.75 }; // ▓ dark shade
    case 0x2596:
      return { rects: [Q_LL] }; // ▖
    case 0x2597:
      return { rects: [Q_LR] }; // ▗
    case 0x2598:
      return { rects: [Q_UL] }; // ▘
    case 0x2599:
      return { rects: [Q_UL, Q_LL, Q_LR] }; // ▙
    case 0x259a:
      return { rects: [Q_UL, Q_LR] }; // ▚
    case 0x259b:
      return { rects: [Q_UL, Q_UR, Q_LL] }; // ▛
    case 0x259c:
      return { rects: [Q_UL, Q_UR, Q_LR] }; // ▜
    case 0x259d:
      return { rects: [Q_UR] }; // ▝
    case 0x259e:
      return { rects: [Q_UR, Q_LL] }; // ▞
    case 0x259f:
      return { rects: [Q_UR, Q_LL, Q_LR] }; // ▟
    default:
      break;
  }

  // Lower blocks ▁▂▃▅▆▇ (U+2581–U+2587, excluding ▄ handled above): bottom n/8.
  if (cp >= 0x2581 && cp <= 0x2587) {
    const n = cp - 0x2580; // 1..7
    return { rects: [[0, 1 - e(n), 1, e(n)]] };
  }
  // Left blocks ▉▊▋▍▎▏ (U+2589–U+258F, excluding ▌ handled above): left n/8.
  if (cp >= 0x2589 && cp <= 0x258f) {
    const n = 0x2590 - cp; // 7..1
    return { rects: [[0, 0, e(n), 1]] };
  }
  return null;
}
