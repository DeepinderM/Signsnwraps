// Mixed-size vinyl stickers cut from one roll (client-safe; the server re-runs it to check prices).
// Every piece is laid out on the roll together (rotating where it helps), and the job is charged for the roll used:
// roll width × length used × the per m² rate, instead of costing each size separately.

export type VinylPiece = { widthMm: number; heightMm: number; qty: number };
/** piece = index into the layout's parts. */
export type Placement = { x: number; y: number; w: number; h: number; piece: number; rotated: boolean };
/** A piece as cut: the whole sticker, or one section of a sticker that's joined (part 1 of 2 …). */
export type CutPart = VinylPiece & { source: number; part: number; of: number };
export type RollLayout = { rollWidthMm: number; lengthMm: number; areaM2: number; placements: Placement[]; count: number; parts: CutPart[]; joins: boolean };

/** Cutting gap between stickers (room to cut and weed); none is added at the roll edges. */
export const VINYL_GAP_MM = 5;
export const VINYL_ROLL_WIDTHS = [1500, 1370];
export const MAX_VINYL_PIECES = 500;

type Segment = { x: number; y: number; w: number };

/** Lowest spot for a w × h box on the skyline (then leftmost), or null if it doesn't fit across the roll. */
function findSpot(skyline: Segment[], w: number, h: number, width: number) {
  let best: { x: number; y: number; index: number } | null = null;
  for (let i = 0; i < skyline.length; i++) {
    const x = skyline[i].x;
    if (x + w > width) break;
    let y = 0, span = 0, j = i;
    while (span < w && j < skyline.length) { y = Math.max(y, skyline[j].y); span += skyline[j].w; j++; }
    if (span < w) continue;
    if (!best || y + h < best.y + h || (y === best.y && x < best.x)) best = { x, y, index: i };
  }
  return best;
}

function place(skyline: Segment[], x: number, y: number, w: number) {
  const next: Segment[] = [];
  for (const seg of skyline) {
    const end = seg.x + seg.w;
    if (end <= x || seg.x >= x + w) { next.push(seg); continue; }
    if (seg.x < x) next.push({ x: seg.x, y: seg.y, w: x - seg.x });
    if (end > x + w) next.push({ x: x + w, y: seg.y, w: end - (x + w) });
  }
  next.push({ x, y, w });
  next.sort((a, b) => a.x - b.x);
  // Merge neighbours at the same height.
  return next.reduce<Segment[]>((out, seg) => { const last = out.at(-1); if (last && last.y === seg.y && last.x + last.w === seg.x) last.w += seg.w; else out.push({ ...seg }); return out; }, []);
}

function pack(items: { w: number; h: number; piece: number }[], width: number, gap: number) {
  // Each box is the sticker plus the gap on its right and bottom; `width` already allows for the last gap at the edge.
  let skyline: Segment[] = [{ x: 0, y: 0, w: width }];
  const placements: Placement[] = [];
  for (const item of items) {
    const options = [{ w: item.w, h: item.h, rotated: false }, ...(item.w !== item.h ? [{ w: item.h, h: item.w, rotated: true }] : [])];
    let chosen: { x: number; y: number; w: number; h: number; rotated: boolean } | null = null;
    for (const option of options) {
      const spot = findSpot(skyline, option.w + gap, option.h + gap, width);
      if (spot && (!chosen || spot.y + option.h < chosen.y + chosen.h || (spot.y + option.h === chosen.y + chosen.h && spot.x < chosen.x))) chosen = { x: spot.x, y: spot.y, ...option };
    }
    if (!chosen) return null;
    skyline = place(skyline, chosen.x, chosen.y + chosen.h + gap, chosen.w + gap);
    placements.push({ x: chosen.x, y: chosen.y, w: chosen.w, h: chosen.h, piece: item.piece, rotated: chosen.rotated });
  }
  const lengthMm = Math.max(0, ...placements.map((item) => item.y + item.h));
  return { placements, lengthMm };
}

/**
 * With joins agreed, a sticker longer than the roll is cut into roll-width sections plus the rest
 * (1700 × 200 on a 1500 roll → 1500 × 200 + 200 × 200) and the sections are joined on site.
 * Without joins (or when a sticker already fits), it stays whole.
 */
export function cutParts(pieces: VinylPiece[], rollWidthMm: number, joins: boolean): CutPart[] {
  return pieces.flatMap((piece, source) => {
    const long = Math.max(piece.widthMm, piece.heightMm), short = Math.min(piece.widthMm, piece.heightMm);
    if (!joins || long <= rollWidthMm) return [{ ...piece, source, part: 1, of: 1 }];
    const sections: number[] = [];
    for (let left = long; left > 0; left -= rollWidthMm) sections.push(Math.min(rollWidthMm, left));
    // Sections of the long side, each `short` deep (a short side wider than the roll still fits once turned).
    return sections.map((length, index) => ({ widthMm: length, heightMm: short, qty: piece.qty, source, part: index + 1, of: sections.length }));
  });
}

/**
 * Lays every piece out on a roll of `rollWidthMm` and returns the shortest layout found (several orderings tried).
 * `joins`: pieces longer than the roll are cut into sections (see cutParts). Null when a piece can't fit, or too many pieces.
 */
export function layoutOnRoll(pieces: VinylPiece[], rollWidthMm: number, gap = VINYL_GAP_MM, joins = false): RollLayout | null {
  const parts = cutParts(pieces, rollWidthMm, joins);
  const items = parts.flatMap((part, index) => Array.from({ length: Math.max(0, Math.floor(part.qty)) }, () => ({ w: Math.round(part.widthMm), h: Math.round(part.heightMm), piece: index })));
  if (!items.length || items.length > MAX_VINYL_PIECES || items.some((item) => !(item.w > 0 && item.h > 0))) return null;
  // A sticker can sit right at the roll edge: its trailing gap may overhang the edge.
  const width = rollWidthMm + gap;
  const orders = [
    [...items].sort((a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h) || b.w * b.h - a.w * a.h),
    [...items].sort((a, b) => b.w * b.h - a.w * a.h),
    [...items].sort((a, b) => Math.min(b.w, b.h) - Math.min(a.w, a.h)),
  ];
  let best: { placements: Placement[]; lengthMm: number } | null = null;
  for (const order of orders) { const result = pack(order, width, gap); if (result && (!best || result.lengthMm < best.lengthMm)) best = result; }
  if (!best) return null;
  return { rollWidthMm, lengthMm: best.lengthMm, areaM2: (rollWidthMm * best.lengthMm) / 1_000_000, placements: best.placements, count: items.length, parts, joins };
}

/** "1700 x 200 mm as 1500 + 200 mm": the stickers that are joined, for the quote line and job sheet. */
export function joinsText(layout: RollLayout) {
  const joined = new Map<number, CutPart[]>();
  for (const part of layout.parts) if (part.of > 1) joined.set(part.source, [...(joined.get(part.source) ?? []), part]);
  return [...joined.values()].map((parts) => { const total = parts.reduce((sum, part) => sum + part.widthMm, 0); return `${total} x ${parts[0].heightMm} mm as ${parts.map((part) => part.widthMm).join(" + ")} mm`; }).join("; ");
}

/** The quote line's joins note; the server reads "Joins agreed" back to lay the pieces out the same way. */
export const JOINS_AGREED = "Joins agreed";

/** Price (ex GST, cents) for the roll used at a per m² rate. */
export const vinylRollPrice = (layout: RollLayout, rateCents: number) => Math.round(layout.areaM2 * rateCents);

/** "1 × 500 x 500 mm, 4 × 200 x 200 mm": also how the server reads the pieces back from a quote line. */
export const piecesText = (pieces: VinylPiece[]) => pieces.filter((piece) => piece.qty > 0).map((piece) => `${piece.qty} × ${piece.widthMm} x ${piece.heightMm} mm`).join(", ");
export function parsePieces(text: string): VinylPiece[] {
  return [...text.matchAll(/(\d+) × (\d+) x (\d+) mm/g)].map((match) => ({ qty: Number(match[1]), widthMm: Number(match[2]), heightMm: Number(match[3]) }));
}

/** Offcuts the client has paid for can be printed with other artwork for the printing cost only (ex GST, cents per m²). */
export const OFFCUT_PRINT_RATE_CENTS = 1600;
/** Smallest offcut worth offering. */
const MIN_OFFCUT_MM = 100, MIN_OFFCUT_M2 = 0.05;
export const OFFCUT_CODE = "VINYL-OFFCUT";

/**
 * The biggest clear rectangle left on the roll the client is paying for (roll width × length used), keeping the cutting
 * gap from every sticker. Null when there's nothing worth offering (or the layout is too busy to search quickly).
 */
export function largestOffcut(layout: RollLayout, gap = VINYL_GAP_MM): { widthMm: number; lengthMm: number; areaM2: number } | null {
  if (layout.placements.length > 80) return null;
  const W = layout.rollWidthMm, L = layout.lengthMm;
  const blocks = layout.placements.map((item) => ({ x1: item.x - gap, y1: item.y - gap, x2: item.x + item.w + gap, y2: item.y + item.h + gap }));
  const xs = [...new Set([0, W, ...blocks.flatMap((block) => [block.x1, block.x2])].map((value) => Math.min(W, Math.max(0, value))))].sort((a, b) => a - b);
  const ys = [...new Set([0, L, ...blocks.flatMap((block) => [block.y1, block.y2])].map((value) => Math.min(L, Math.max(0, value))))].sort((a, b) => a - b);
  let best: { widthMm: number; lengthMm: number; areaM2: number } | null = null;
  for (let a = 0; a < xs.length; a++) for (let b = a + 1; b < xs.length; b++) {
    const x1 = xs[a], x2 = xs[b], w = x2 - x1;
    if (w < MIN_OFFCUT_MM) continue;
    // Tallest clear run of this column: walk down the y edges, restarting after any sticker in the way.
    let start = 0;
    for (const y of [...ys.filter((value) => value > 0), Infinity]) {
      const blocked = blocks.filter((block) => block.x1 < x2 && block.x2 > x1 && block.y1 < Math.min(y, L) && block.y2 > start);
      if (blocked.length || y === Infinity) {
        const end = blocked.length ? Math.min(...blocked.map((block) => block.y1)) : L;
        const h = Math.max(0, Math.min(end, L) - start);
        if (h >= MIN_OFFCUT_MM && (!best || w * h > best.widthMm * best.lengthMm)) best = { widthMm: Math.round(w), lengthMm: Math.round(h), areaM2: (w * h) / 1_000_000 };
        if (blocked.length) start = Math.max(...blocked.map((block) => block.y2));
        if (y === Infinity) break;
      }
    }
  }
  return best && best.areaM2 >= MIN_OFFCUT_M2 ? best : null;
}

/** Printing-only price for an offcut. */
export const offcutPrice = (offcut: { widthMm: number; lengthMm: number }, rateCents = OFFCUT_PRINT_RATE_CENTS) => Math.round((offcut.widthMm * offcut.lengthMm * rateCents) / 1_000_000);

/** Total printed area of the pieces (m²). */
export const printedAreaM2 = (pieces: VinylPiece[]) => pieces.reduce((sum, piece) => sum + (piece.widthMm * piece.heightMm * piece.qty) / 1_000_000, 0);

/**
 * Lays the client's extra stickers out inside an offcut (either way round). Returns the layout if they all fit within
 * the offcut's width and length, or null if they don't. Never longer than the offcut: nothing is printed outside it.
 */
export function fitInOffcut(pieces: VinylPiece[], offcut: { widthMm: number; lengthMm: number }) {
  const tries = [{ across: offcut.widthMm, along: offcut.lengthMm }, { across: offcut.lengthMm, along: offcut.widthMm }];
  let best: RollLayout | null = null;
  for (const side of tries) {
    if (pieces.some((piece) => Math.min(piece.widthMm, piece.heightMm) > side.across)) continue;
    const layout = layoutOnRoll(pieces, side.across);
    if (layout && layout.lengthMm <= side.along && (!best || layout.lengthMm / side.along < best.lengthMm / (best.rollWidthMm === offcut.widthMm ? offcut.lengthMm : offcut.widthMm))) best = layout;
  }
  return best;
}
