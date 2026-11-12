// Lightbox price list (ex GST, AUD) and custom-size pricing. One set of tables feeds both the quote catalog
// (category "Lightboxes") and the custom-size calculator, so a price change here updates both.
// Sizes are in millimetres. A "special" size (marked * on the supplier list) has a price but is made to
// special order: it's labelled as such, and custom sizes priced from it carry a note to confirm with the supplier.
//
// Custom sizes are priced between the nearest list sizes:
// - rectangular: along the height for the two nearest widths, then between those widths;
// - square by side, round by diameter (within the chosen style).
// Below the smallest list size the smallest size's price applies; beyond the largest, the price is extended
// from the last step and flagged for a check with the supplier.

export type LightboxShape = "Round" | "Square" | "Rectangular";
export type Sides = "D" | "S";
export type RectSides = Sides;
export type RoundStyle = "SS" | "DV" | "DF" | "DB";

/** Single-sided rectangular and square lightboxes are this much less than double-sided. */
export const SINGLE_SIDED_DISCOUNT = 50;

export const ROUND_STYLES: { code: RoundStyle; name: string }[] = [
  { code: "SS", name: "Single-sided" },
  { code: "DV", name: "Double-sided, vacuum-formed" },
  { code: "DF", name: "Double-sided, flat face" },
  { code: "DB", name: "Double-sided, with brackets" },
];

/** Frames are black unless the client asks for a specific colour. */
export const DEFAULT_FRAME_COLOUR = "Black";
export const FRAME_COLOURS = ["Black", "White", "Silver"];
/** Frame colour text for a quote line (empty → Black). */
export const frameColourLine = (colour: string) => `Frame colour: ${colour.trim() || DEFAULT_FRAME_COLOUR}`;

type Cell = { price: number; special?: boolean };
const c = (price: number, special = false): Cell => ({ price, special });

/** Rectangular, double-sided: width mm → { height mm → price }. Blank cells on the list aren't made. */
const RECT: Record<number, Record<number, Cell>> = {
  400: { 300: c(905), 350: c(915), 400: c(915) },
  500: { 300: c(925), 350: c(940), 400: c(955), 450: c(965), 500: c(975) },
  600: { 300: c(955), 350: c(965), 400: c(975), 450: c(985), 500: c(995), 550: c(1010), 600: c(1035) },
  700: { 300: c(1005), 350: c(1015), 400: c(1025), 500: c(1055), 600: c(1085), 700: c(1165) },
  800: { 300: c(1045), 350: c(1045), 400: c(1065), 500: c(1085), 600: c(1115), 700: c(1175), 800: c(1255) },
  900: { 300: c(1095), 350: c(1095), 400: c(1105), 500: c(1145), 600: c(1175), 700: c(1225), 800: c(1305), 900: c(1335) },
  1000: { 300: c(1125), 350: c(1125), 400: c(1135), 500: c(1175), 600: c(1215), 700: c(1275), 800: c(1345), 900: c(1405, true), 1000: c(1495, true) },
  // 1200 × 1200 is a listed custom size ($1,550 double / $1,500 single).
  1200: { 300: c(1175), 350: c(1175), 400: c(1185), 500: c(1235), 600: c(1295), 700: c(1365), 800: c(1435), 1200: c(1550, true) },
  1400: { 300: c(1335), 350: c(1335), 400: c(1345), 500: c(1395), 600: c(1455), 700: c(1505, true), 800: c(1585, true) },
  1500: { 300: c(1385), 350: c(1385), 400: c(1405), 500: c(1445), 600: c(1525), 700: c(1595, true), 800: c(1685, true) },
  1600: { 300: c(1445), 350: c(1445), 400: c(1475), 500: c(1515), 600: c(1595), 700: c(1655, true), 800: c(1755, true) },
  1700: { 300: c(1505), 350: c(1505), 400: c(1535), 500: c(1575), 600: c(1655), 700: c(1725, true), 800: c(1835, true) },
  1800: { 300: c(1585), 350: c(1585), 400: c(1625), 500: c(1665), 600: c(1745), 700: c(1795, true), 800: c(1905, true) },
  2000: { 300: c(1875), 350: c(1875), 400: c(1925), 500: c(1965), 600: c(2085), 700: c(2105, true), 800: c(2205, true) },
  2200: { 300: c(1995), 350: c(1995), 400: c(2045), 500: c(2100), 600: c(2215) },
  2400: { 300: c(2145), 350: c(2145), 400: c(2205), 500: c(2265), 600: c(2385) },
};

/** Square, double-sided: side mm → price (single-sided is $50 less). */
const SQUARE: Record<number, number> = { 350: 905, 400: 915, 450: 935, 500: 975, 550: 1015, 600: 1035, 650: 1115, 700: 1165 };

/** Round: diameter mm → price per style ("–" on the list = not made in that style). */
const ROUND: Record<number, Partial<Record<RoundStyle, Cell>>> = {
  400: { SS: c(885), DF: c(935), DB: c(955) },
  500: { SS: c(900), DF: c(950), DB: c(1015) },
  600: { SS: c(945), DV: c(985), DF: c(995), DB: c(1115) },
  700: { SS: c(1065), DV: c(1105), DF: c(1115), DB: c(1215) },
  800: { SS: c(1205), DV: c(1245), DF: c(1255), DB: c(1355) },
  900: { SS: c(1325), DF: c(1375, true), DB: c(1395, true) },
  1000: { SS: c(1505), DF: c(1555, true), DB: c(1575, true) },
  1200: { SS: c(2355), DF: c(2405, true), DB: c(2425, true) },
};

const cents = (dollars: number) => Math.round(dollars * 100);
const money = (dollars: number) => `$${dollars.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const sizes = (record: Record<number, unknown>) => Object.keys(record).map(Number).sort((a, b) => a - b);
const SPECIAL = " (special order)";

type Option = { name: string; values: { label: string; extraCents: number }[] };

/** Every list size as a quote catalog product. Defaults (first option values) are double-sided. */
export function lightboxCatalogItems() {
  const item = (id: string, name: string, subcategory: string, price: number, description: string, options: Option[]) =>
    ({ id: `lightbox-${id.toLowerCase()}`, name, category: "Lightboxes", subcategory, priceCents: cents(price), unit: "each", code: id, description, options });
  const sidesOption: Option = { name: "Sides", values: [{ label: "Double-sided", extraCents: 0 }, { label: "Single-sided", extraCents: -cents(SINGLE_SIDED_DISCOUNT) }] };

  // Rectangular: one product per width, priced at its lowest height; the Height option adds the difference.
  const rect = sizes(RECT).map((w) => {
    const heights = sizes(RECT[w]), base = RECT[w][heights[0]].price;
    const special = heights.some((h) => RECT[w][h].special) ? " Sizes marked special order: confirm the lead time with the supplier." : "";
    return item(`LB-W${w}`, `Rectangular lightbox ${w}mm wide`, "Rectangular", base, `Rectangular lightbox, ${w} mm wide, ${heights[0]}–${heights.at(-1)} mm high.${special}`,
      [{ name: "Height", values: heights.map((h) => ({ label: `${w} × ${h}mm${RECT[w][h].special ? SPECIAL : ""}`, extraCents: cents(RECT[w][h].price - base) })) }, sidesOption]);
  });
  const square = sizes(SQUARE).map((s) => item(`LB-S${s}`, `Square lightbox ${s}×${s}mm`, "Square", SQUARE[s], `Square lightbox, ${s} × ${s} mm.`, [sidesOption]));
  // Round: one product per diameter and style.
  const round = sizes(ROUND).flatMap((d) => ROUND_STYLES.filter((style) => ROUND[d][style.code]).map((style) => {
    const cell = ROUND[d][style.code]!;
    const special = cell.special ? " Special order: confirm the lead time with the supplier." : "";
    return item(`LB-R${d}-${style.code}`, `Round lightbox Ø${d}mm · ${style.name.toLowerCase()}${cell.special ? SPECIAL : ""}`, "Round", cell.price, `Round lightbox, Ø${d} mm, ${style.name.toLowerCase()}.${special}`, []);
  }));
  return [...round, ...square, ...rect];
}

export type LightboxQuote = { cents: number; code: string; basis: string; warning: string } | { error: string };
type Point = { size: number; price: number; special?: boolean };
type Along = { price: number; basis: string; special: boolean; beyond: boolean };

/** Price at `size` from list points: exact, between two points, smallest price below, extended above. */
function along(points: Point[], size: number, label: (size: number) => string): Along {
  const first = points[0], last = points.at(-1)!;
  const exact = points.find((point) => point.size === size);
  if (exact) return { price: exact.price, basis: `List size ${label(size)}`, special: !!exact.special, beyond: false };
  if (size < first.size) return { price: first.price, basis: `Smallest list size (${label(first.size)}) price`, special: !!first.special, beyond: false };
  if (size > last.size) {
    const prev = points.at(-2);
    const step = prev ? (last.price - prev.price) / (last.size - prev.size) : 0;
    return { price: last.price + step * (size - last.size), basis: prev ? `Extended from ${label(prev.size)} and ${label(last.size)}` : `${label(last.size)} price`, special: !!last.special, beyond: true };
  }
  const upper = points.findIndex((point) => point.size > size);
  const a = points[upper - 1], b = points[upper];
  return { price: a.price + ((b.price - a.price) * (size - a.size)) / (b.size - a.size), basis: `Between ${label(a.size)} (${money(a.price)}) and ${label(b.size)} (${money(b.price)})`, special: !!(a.special || b.special), beyond: false };
}

function quote(price: number, code: string, basis: string, special: boolean, beyond: string): LightboxQuote {
  const warning = [beyond && `${beyond}: estimated, confirm with the supplier before sending.`, special && "Priced from a special-order size: confirm the lead time with the supplier."].filter(Boolean).join(" ");
  return { cents: cents(price), code, basis, warning };
}

/** Rectangular custom size: along the height for the two nearest widths, then between those widths. */
export function rectLightboxPrice(widthMm: number, heightMm: number, sides: Sides): LightboxQuote {
  if (!(widthMm > 0) || !(heightMm > 0)) return { error: "Enter the width and height." };
  const widths = sizes(RECT);
  const minHeight = Math.min(...widths.map((w) => sizes(RECT[w])[0]));
  if (heightMm < minHeight) return { error: `Rectangular lightboxes start at ${minHeight} mm high. For something smaller, use a square or round lightbox.` };
  const atWidth = (w: number) => along(sizes(RECT[w]).map((h) => ({ size: h, ...RECT[w][h] })), heightMm, (h) => `${w} × ${h}mm`);
  const below = widths.filter((w) => w <= widthMm), above = widths.filter((w) => w >= widthMm);
  // Widths outside the list use the two nearest widths at that end (extended above, smallest width below).
  const [lo, hi] = !below.length ? [widths[0], widths[0]] : !above.length ? [widths.at(-2)!, widths.at(-1)!] : [below.at(-1)!, above[0]];
  const a = atWidth(lo), b = atWidth(hi);
  const price = lo === hi ? a.price : a.price + ((b.price - a.price) * (widthMm - lo)) / (hi - lo);
  const basis = lo === hi ? a.basis : !above.length ? `Extended from ${lo}mm and ${hi}mm wide at ${heightMm}mm high` : `Between ${lo}mm wide (${money(a.price)}) and ${hi}mm wide (${money(b.price)}) at ${heightMm}mm high`;
  const beyond = !above.length ? `Wider than the price list (${widths.at(-1)}mm max)` : a.beyond || b.beyond ? `Taller than the price list for this width` : "";
  return quote(price - (sides === "S" ? SINGLE_SIDED_DISCOUNT : 0), `LB-W${widthMm}x${heightMm}-${sides}`, basis, a.special || b.special, beyond);
}

export function squareLightboxPrice(sideMm: number, sides: Sides = "D"): LightboxQuote {
  if (!(sideMm > 0)) return { error: "Enter the size." };
  const result = along(sizes(SQUARE).map((s) => ({ size: s, price: SQUARE[s] })), sideMm, (s) => `${s}×${s}mm`);
  return quote(result.price - (sides === "S" ? SINGLE_SIDED_DISCOUNT : 0), `LB-S${sideMm}-${sides}`, result.basis, false, result.beyond ? `Larger than the price list (${sizes(SQUARE).at(-1)}mm max)` : "");
}

export function roundLightboxPrice(style: RoundStyle, diameterMm: number): LightboxQuote {
  if (!(diameterMm > 0)) return { error: "Enter the diameter." };
  const points = sizes(ROUND).filter((d) => ROUND[d][style]).map((d) => ({ size: d, ...ROUND[d][style]! }));
  const name = ROUND_STYLES.find((item) => item.code === style)!.name.toLowerCase();
  const result = along(points, diameterMm, (d) => `Ø${d}mm`);
  return quote(result.price, `LB-R${diameterMm}-${style}`, result.basis, result.special, result.beyond ? `Larger than the ${name} price list (Ø${points.at(-1)!.size}mm max)` : "");
}
