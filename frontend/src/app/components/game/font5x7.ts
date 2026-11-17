/* ---------------------------------------------------------------------------
   A 5x7 bitmap font.

   Each glyph is seven strings of five characters; "1" is a lit pixel, which
   becomes one brick. Kept as text rather than packed bits on purpose — the
   letterforms are legible in the source, so a wrong pixel is visible when
   reading the file rather than only when playing.

   Covers A-Z, 0-9 and the punctuation an address or command needs. Anything
   outside the set falls back to a blank cell, so unsupported input thins the
   wall rather than throwing.
--------------------------------------------------------------------------- */

export const GLYPH_W = 5;
export const GLYPH_H = 7;

export const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01110"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],

  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],

  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  _: ["00000", "00000", "00000", "00000", "00000", "00000", "11111"],
};

/** Characters the inputs accept. Anything else is stripped as it is typed. */
export const ALLOWED = /[A-Z0-9 .:/_-]/;

export type Brick = { col: number; row: number; alive: boolean };

const LETTER_GAP = 1;
const LINE_GAP = 1;

/**
 * Lay lines of text out on a single grid of cells.
 *
 * Lines are centred against the widest one, so a short line over a long one
 * reads as a centred block rather than being pinned left.
 */
export function rasterize(lines: string[]): {
  bricks: Brick[];
  cols: number;
  rows: number;
} {
  const bricks: Brick[] = [];
  const used = lines.filter((line) => line.length > 0);
  if (used.length === 0) return { bricks, cols: 1, rows: 1 };

  const lineWidth = (line: string) =>
    line.length * GLYPH_W + (line.length - 1) * LETTER_GAP;

  const cols = Math.max(...used.map(lineWidth));
  const rows = used.length * GLYPH_H + (used.length - 1) * LINE_GAP;

  used.forEach((line, lineIndex) => {
    const offsetX = Math.floor((cols - lineWidth(line)) / 2);
    const offsetY = lineIndex * (GLYPH_H + LINE_GAP);

    line.split("").forEach((char, charIndex) => {
      const glyph = FONT[char] ?? FONT[" "];
      const charX = offsetX + charIndex * (GLYPH_W + LETTER_GAP);

      glyph.forEach((bits, r) => {
        bits.split("").forEach((bit, c) => {
          if (bit === "1") {
            bricks.push({ col: charX + c, row: offsetY + r, alive: true });
          }
        });
      });
    });
  });

  return { bricks, cols, rows };
}
