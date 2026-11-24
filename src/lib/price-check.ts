import "server-only";
import { ACP_PANELS, panelsForSet, planAcpJob, PVC_MOUNT_PRICES } from "@/lib/acp-panels";
import type { LineItem } from "@/lib/billing";
import { rollUsage, type CatalogItem } from "@/lib/catalog-types";
import { customStickerPrice, sizeFromName, STICKER_M2_RATES, stickerDesignOptions, stickerPriceAtRate, stickerReferences } from "@/lib/custom-sticker";
import { CHANNEL_MOUNT, decodeLetterCode, installationOptions, letterHeights, letterPriceCents, POWER_ADAPTER, SMALL_NON_LIT } from "@/lib/letter-signs";
import { fitInOffcut, JOINS_AGREED, largestOffcut, layoutOnRoll, OFFCUT_CODE, OFFCUT_PRINT_RATE_CENTS, parsePieces, printedAreaM2, VINYL_GAP_MM, VINYL_ROLL_WIDTHS, vinylRollPrice } from "@/lib/vinyl-nest";
import { rectLightboxPrice, roundLightboxPrice, squareLightboxPrice, type RoundStyle } from "@/lib/lightboxes";

// Store staff can't set prices: every new line they add must cost exactly what the catalog or a calculator charges.
// This re-works the price out on the server from the line itself (code, size, options); null = the price checks out.

/** A rate from the line ("65.00") if it's one of the set per m² rates, else null. */
const setRate = (text: string) => { const cents = Math.round(Number(text.replace(/,/g, "")) * 100); return STICKER_M2_RATES.includes(cents) ? cents : null; };

/** Every total the options can add (one value per option), without listing every combination. */
function optionSums(item: Pick<CatalogItem, "options">) {
  let sums = new Set([0]);
  for (const option of item.options) {
    const next = new Set<number>();
    for (const sum of sums) for (const value of option.values) next.add(sum + value.extraCents);
    sums = next.size > 20000 ? new Set([...next].slice(0, 20000)) : next;
  }
  return sums;
}

function catalogMatch(line: LineItem, catalog: CatalogItem[]) {
  const first = line.description.split("\n")[0].trim();
  return catalog.filter((item) => (line.code && item.code === line.code) || item.name === first || first.startsWith(`${item.name}`));
}

function fromCatalog(line: LineItem, catalog: CatalogItem[]) {
  // Several sizes of one roll product, nested together: priced from the roll used at the product's own rate.
  const pieces = /\nPieces: (.+)/.exec(line.description);
  if (pieces) {
    const item = catalogMatch(line, catalog).find((entry) => entry.pricing === "roll");
    const layout = item ? layoutOnRoll(parsePieces(pieces[1]), item.rollWidthMm, VINYL_GAP_MM, line.description.includes(`\n${JOINS_AGREED}:`)) : null;
    if (!item || !layout || line.qty !== 1) return false;
    const base = Math.round(item.priceCents * layout.areaM2);
    return [...optionSums(item)].some((extra) => base + extra === line.unitCents);
  }
  for (const item of catalogMatch(line, catalog)) {
    const base = line.roll && item.pricing === "roll" ? Math.round(item.priceCents * rollUsage(line.roll.widthMm, line.roll.heightMm, item.rollWidthMm).areaM2) : line.roll ? null : item.priceCents;
    if (base === null) continue;
    for (const extra of optionSums(item)) if (base + extra === line.unitCents) return true;
  }
  return false;
}

function fromCalculators(line: LineItem, catalog: CatalogItem[]) {
  const code = (line.code ?? "").toUpperCase(), unit = line.unitCents;
  // 3D letters: the per-letter price for the height band, or (small non-lit) the sheet-row total in the production notes.
  if (code.startsWith("3DL-") && code !== POWER_ADAPTER.code && code !== CHANNEL_MOUNT.code) {
    const decoded = decodeLetterCode(code);
    const band = decoded && letterHeights.find((item) => item.code === decoded.parts[2].code);
    if (!decoded || !band) return false;
    const [, light, , depth, face, sides, back] = decoded.parts.map((part) => part.code);
    if (light === "NL" && band.upTo <= SMALL_NON_LIT.maxMm) {
      const rows = /priced (\d+) × \$[\d,.]+ \+ (\d+) × \$[\d,.]+/.exec(line.production ?? "");
      return !!rows && line.qty === 1 && unit === Number(rows[1]) * SMALL_NON_LIT.firstLetterCents + Number(rows[2]) * SMALL_NON_LIT.nextLetterCents;
    }
    return letterPriceCents({ light, heightMm: band.upTo, depth, face, sides, back }) === unit;
  }
  if (code === POWER_ADAPTER.code) return unit === POWER_ADAPTER.priceCents;
  if (code === CHANNEL_MOUNT.code) return unit === CHANNEL_MOUNT.priceCents;
  if (code.startsWith("INST-")) return installationOptions.some((option) => option.code === code && option.priceCents === unit);
  // Mounting panels from the letter builder: ACP sheets, or PVC sheets (MNT-PVC16-W).
  if (ACP_PANELS.some((panel) => panel.code === code && panel.priceCents === unit)) return true;
  const pvc = /^MNT-PVC(10|16|20)-(W|B)$/.exec(code);
  if (pvc) return unit === PVC_MOUNT_PRICES[pvc[2] === "B" ? "black" : "white"];
  // ACP sign: the cheapest sheet plan for the size, number of signs and chosen sheet sizes.
  if (code === "ACP-SIGN" && line.acp) {
    const job = planAcpJob(line.acp.widthMm, line.acp.heightMm, line.acp.signs ?? Math.max(1, Math.round(line.qty)), panelsForSet(line.acp.panelSet));
    return !!job && Math.round(line.qty * unit) === job.costCents;
  }
  // Mixed-size vinyl stickers: the pieces and roll from the line, laid out again, at one of the set rates.
  if (code === "VINYL-MIX") {
    const pieces = parsePieces(/Pieces: (.+)/.exec(line.description)?.[1] ?? "");
    const roll = /Cut from a (\d+) mm roll: \d+ mm used \([\d.]+ m²\) at \$([\d,.]+) per m²/.exec(line.description);
    const rate = roll ? setRate(roll[2]) : null;
    if (!pieces.length || !roll || rate === null || !VINYL_ROLL_WIDTHS.includes(Number(roll[1]))) return false;
    const layout = layoutOnRoll(pieces, Number(roll[1]), VINYL_GAP_MM, line.description.includes(`\n${JOINS_AGREED}:`));
    return !!layout && line.qty === 1 && vinylRollPrice(layout, rate) === unit;
  }
  // Custom-size lightboxes.
  const rect = /^LB-W(\d+)X(\d+)-(D|S)$/.exec(code), square = /^LB-S(\d+)-(D|S)$/.exec(code), round = /^LB-R(\d+)-(SS|DV|DF|DB)$/.exec(code);
  const quote = rect ? rectLightboxPrice(Number(rect[1]), Number(rect[2]), rect[3] as "D" | "S") : square ? squareLightboxPrice(Number(square[1]), square[2] as "D" | "S") : round ? roundLightboxPrice(round[2] as RoundStyle, Number(round[1])) : null;
  if (quote) return "cents" in quote && quote.cents === unit;
  // Custom-size stickers (priced from the standard sticker sizes in the catalog, plus the design service).
  const sticker = /^Custom (Circle|Square|Rectangle) Sticker - (\d+)(?: x (\d+))? mm(?: diameter)?\nQuantity: ([^·\n]+?)(?: · Designing: ([^\n]+))?(?:\n\$[\d,.]+ per m² of print)?(?:\nPriced at \$([\d,.]+) per m² of print)?$/.exec(line.description.trim());
  if (sticker) {
    const w = Number(sticker[2]), h = sticker[3] ? Number(sticker[3]) : w;
    const design = sticker[5] ? stickerDesignOptions(catalog).find((value) => value.label === sticker[5].trim())?.extraCents ?? null : 0;
    if (design === null) return false;
    // Priced at one of the set per m² rates: rate × printed area.
    if (sticker[6]) { const rate = setRate(sticker[6]); return rate !== null && stickerPriceAtRate(rate, w, h, sticker[4].trim()) + design === unit; }
    const price = customStickerPrice(stickerReferences(catalog), w, h, sticker[4].trim());
    return !!price && price.cents + design === unit;
  }
  // A standard sticker priced at a set per m² rate: the size from its name, the run and design from the line.
  const rated = /\nPriced at \$([\d,.]+) per m² of print$/.exec(line.description.trim());
  if (rated) {
    const rate = setRate(rated[1]);
    const first = line.description.split("\n")[0].trim();
    const item = catalog.find((entry) => entry.category === "Stickers" && entry.name === first);
    const size = item ? sizeFromName(item.name) : null;
    const run = /Quantity: ([^·\n]+)/.exec(line.description)?.[1].trim();
    const designLabel = /Designing: ([^·\n]+)/.exec(line.description)?.[1].trim();
    const design = designLabel ? item?.options.find((option) => option.name.toLowerCase() === "designing")?.values.find((value) => value.label === designLabel)?.extraCents ?? null : 0;
    return rate !== null && !!size && !!run && design !== null && stickerPriceAtRate(rate, size[0], size[1], run) + design === unit;
  }
  return false;
}

/** The roll layout behind a vinyl line (mixed sizes, a roll product with several sizes, or one roll-priced sticker). */
function vinylLayout(line: LineItem, catalog: CatalogItem[]) {
  const joins = line.description.includes(`\n${JOINS_AGREED}:`);
  const pieces = /\nPieces: (.+)/.exec(line.description);
  if ((line.code ?? "").toUpperCase() === "VINYL-MIX") {
    const roll = /Cut from a (\d+) mm roll/.exec(line.description);
    return pieces && roll ? layoutOnRoll(parsePieces(pieces[1]), Number(roll[1]), VINYL_GAP_MM, joins) : null;
  }
  const item = catalogMatch(line, catalog).find((entry) => entry.pricing === "roll");
  if (!item) return null;
  if (pieces) return layoutOnRoll(parsePieces(pieces[1]), item.rollWidthMm, VINYL_GAP_MM, joins);
  return line.roll && line.qty === 1 ? layoutOnRoll([{ widthMm: line.roll.widthMm, heightMm: line.roll.heightMm, qty: 1 }], item.rollWidthMm) : null;
}

/** An offcut line: printing only, at the offcut rate, for exactly the offcut another vinyl line on the document leaves. */
function offcutOk(line: LineItem, catalog: CatalogItem[], items: LineItem[]) {
  const size = /Offcut from this job: (\d+) x (\d+) mm/.exec(line.description);
  const printed = /Printed on it: (.+) \([\d.]+ m² printed\) at \$([\d,.]+) per m²/.exec(line.description);
  if (!size || !printed || Math.round(Number(printed[2].replace(/,/g, "")) * 100) !== OFFCUT_PRINT_RATE_CENTS || line.qty !== 1) return false;
  const offcut = { widthMm: Number(size[1]), lengthMm: Number(size[2]) };
  // The extra stickers must all fit inside the offcut, and are charged for the area printed.
  const pieces = parsePieces(printed[1]);
  if (!pieces.length || !fitInOffcut(pieces, offcut) || Math.round(printedAreaM2(pieces) * OFFCUT_PRINT_RATE_CENTS) !== line.unitCents) return false;
  return items.some((other) => {
    if (other === line) return false;
    const layout = vinylLayout(other, catalog), found = layout ? largestOffcut(layout) : null;
    return !!found && found.widthMm === offcut.widthMm && found.lengthMm === offcut.lengthMm;
  });
}

/** Null when the line's price is what the catalog / calculators charge; otherwise why it can't be accepted. */
export function priceProblem(line: LineItem, catalog: CatalogItem[], items: LineItem[] = []) {
  if (!line.gst) return "GST can't be turned off";
  if ((line.code ?? "").toUpperCase() === OFFCUT_CODE) return offcutOk(line, catalog, items) ? null : "the offcut doesn't match a vinyl line on this document";
  if (fromCatalog(line, catalog) || fromCalculators(line, catalog)) return null;
  return "its price doesn't match the catalog";
}
