import type { CatalogItem } from "@/lib/catalog-types";

// Custom-size sticker pricing, derived from the standard sticker sizes in the catalog.
// Sticker prices follow area (circles are priced like the square of their diameter), so for the chosen
// quantity we interpolate the price between the two nearest standard sizes by area. Smaller than the
// smallest size pays that size's price (minimum charge); larger than the largest scales up by area
// and is flagged for a manual check. Prices come from the live catalog, so editing a sticker's price
// (or a new Odoo import) changes custom pricing too.

/** Standard sizes left out of the calculation because their Odoo prices don't follow the rest of the range. */
const EXCLUDED = new Set(["circle-sticker-90-x-90-mm"]);
export const STICKER_SHAPES = ["Circle", "Square", "Rectangle"] as const;
export type StickerShape = (typeof STICKER_SHAPES)[number];
export const MIN_STICKER_MM = 20;
export const MAX_STICKER_MM = 1000;

type Reference = { id: string; name: string; areaCm2: number; totals: Map<string, number> };

/** Width × height in mm from names like "Rectangle Sticker - 148 x 110 mm". */
const sizeFromName = (name: string) => { const match = /(\d+)\s*x\s*(\d+)\s*mm/i.exec(name); return match ? [Number(match[1]), Number(match[2])] as const : null; };

export function stickerReferences(items: CatalogItem[]) {
  const references: Reference[] = [];
  for (const item of items) {
    const size = sizeFromName(item.name);
    if (item.category !== "Stickers" || !size || EXCLUDED.has(item.id)) continue;
    const quantity = item.options.find((option) => option.name.toLowerCase() === "quantity");
    if (!quantity) continue;
    references.push({ id: item.id, name: item.name, areaCm2: (size[0] * size[1]) / 100, totals: new Map(quantity.values.map((value) => [value.label, item.priceCents + value.extraCents])) });
  }
  return references.sort((a, b) => a.areaCm2 - b.areaCm2);
}

/** Quantity tiers every reference size offers (e.g. 200, 300 … 1000). */
export function stickerQuantities(references: Reference[]) {
  if (!references.length) return [];
  return [...references[0].totals.keys()].filter((label) => references.every((reference) => reference.totals.has(label)));
}

/** The design-service prices most stickers use (e.g. $0 / $25 / $65). */
export function stickerDesignOptions(items: CatalogItem[]) {
  const counts = new Map<string, { values: { label: string; extraCents: number }[]; count: number }>();
  for (const item of items) {
    if (item.category !== "Stickers") continue;
    const design = item.options.find((option) => option.name.toLowerCase() === "designing");
    if (!design) continue;
    const key = JSON.stringify(design.values);
    counts.set(key, { values: design.values, count: (counts.get(key)?.count ?? 0) + 1 });
  }
  return [...counts.values()].sort((a, b) => b.count - a.count)[0]?.values ?? [];
}

export type CustomStickerPrice = { cents: number; basis: string; warning: string };

/** Price (ex GST) for one print run of a custom-size sticker at the chosen quantity tier, before design service. */
export function customStickerPrice(references: Reference[], widthMm: number, heightMm: number, quantity: string): CustomStickerPrice | null {
  const points = references.filter((reference) => reference.totals.has(quantity));
  if (!points.length || !(widthMm > 0) || !(heightMm > 0)) return null;
  // Several standard sizes can share an area (e.g. circle and square); average them.
  const byArea = new Map<number, { total: number; names: string[] }>();
  for (const point of points) {
    const current = byArea.get(point.areaCm2) ?? { total: 0, names: [] };
    byArea.set(point.areaCm2, { total: current.total + point.totals.get(quantity)!, names: [...current.names, point.name] });
  }
  const curve = [...byArea].map(([area, { total, names }]) => ({ area, cents: total / names.length, label: names[0].replace(/^(Circle|Square|Rectangle) Sticker - /i, "") })).sort((a, b) => a.area - b.area);
  const area = (widthMm * heightMm) / 100;
  const roundUp = (cents: number) => Math.ceil(cents / 100) * 100; // whole dollars, like the price list
  const first = curve[0], last = curve[curve.length - 1];
  if (area <= first.area) return { cents: roundUp(first.cents), basis: `Minimum price: same as ${first.label}`, warning: "" };
  if (area > last.area) return { cents: roundUp(last.cents * (area / last.area)), basis: `Scaled up by area from ${last.label}`, warning: `Larger than the biggest standard sticker (${last.label}). The price is scaled by area, so check it before sending.` };
  const upper = curve.findIndex((point) => point.area >= area);
  const low = curve[upper - 1], high = curve[upper];
  if (high.area === area) return { cents: roundUp(high.cents), basis: `Same area as ${high.label}`, warning: "" };
  const cents = low.cents + ((high.cents - low.cents) * (area - low.area)) / (high.area - low.area);
  return { cents: roundUp(cents), basis: `Between ${low.label} and ${high.label}`, warning: "" };
}
