// Shared (client + server) catalog types and pricing.

export type CatalogOptionValue = { label: string; extraCents: number };
/** e.g. Quantity (200 / 300 / … with extra prices) or Designing (print-ready / fix / from scratch). */
export type CatalogOption = { name: string; values: CatalogOptionValue[] };
export type CatalogItem = {
  id: string; name: string; category: string;
  /** Optional grouping inside a category, e.g. Stickers › Circle / Square / Rectangle. */
  subcategory: string;
  priceCents: number; unit: string; description: string;
  options: CatalogOption[]; active: boolean; source: string;
  /**
   * "fixed": the price is per item. "roll": the price is per m² of vinyl roll used (see rollUsage), for
   * printed vinyl made to any size.
   */
  pricing: CatalogPricing;
  /** Usable roll width for "roll" pricing (mm); 1500 if not set. */
  rollWidthMm: number;
  /** Product code shown to the client and production (e.g. 3DL-LINE); copied onto quote lines. */
  code: string;
  /** Build instructions for the production job sheet (not shown to the client); copied onto quote lines. */
  production: string;
};

export type CatalogPricing = "fixed" | "roll";
export const DEFAULT_ROLL_WIDTH_MM = 1500;
export const pricingLabels: Record<CatalogPricing, string> = { fixed: "Fixed price per item", roll: "Per m² of vinyl roll used (any size)" };

/**
 * Vinyl used to print a piece: the shorter side is split into roll-width strips (one strip up to the roll
 * width, two up to twice that, …) and every strip runs the full length of the longest side.
 * 2000 x 1000 → 1 strip 1500 x 2000 = 3 m²; 3000 x 2000 or 3000 x 3000 → 2 strips 1500 x 3000 = 9 m².
 */
export function rollUsage(widthMm: number, heightMm: number, rollWidthMm = DEFAULT_ROLL_WIDTH_MM) {
  const lengthMm = Math.max(widthMm, heightMm);
  const strips = Math.max(1, Math.ceil(Math.min(widthMm, heightMm) / rollWidthMm));
  return { strips, lengthMm, rollWidthMm, areaM2: (strips * rollWidthMm * lengthMm) / 1_000_000 };
}

/** Price (ex GST) of one piece of a roll-priced product at a size, plus chosen option extras. */
export function rollPrice(item: Pick<CatalogItem, "priceCents" | "options" | "rollWidthMm">, widthMm: number, heightMm: number, choices: number[]) {
  return Math.round(item.priceCents * rollUsage(widthMm, heightMm, item.rollWidthMm).areaM2) + catalogPrice({ priceCents: 0, options: item.options }, choices);
}

/** Unit price (ex GST) for a product with the chosen option values (index per option; default = first value). */
export function catalogPrice(item: Pick<CatalogItem, "priceCents" | "options">, choices: number[]) {
  return item.priceCents + item.options.reduce((sum, option, index) => sum + (option.values[choices[index] ?? 0]?.extraCents ?? 0), 0);
}

/**
 * How an option value reads: quantities show the full price for that quantity ("500 — $165.00"),
 * other options show what they add ("+$65.00"), since a quantity replaces the base rather than adding to it.
 */
export function optionValueLabel(item: Pick<CatalogItem, "priceCents">, option: CatalogOption, value: CatalogOptionValue, money: (cents: number) => string) {
  if (option.name.toLowerCase() === "quantity") return `${value.label} — ${money(item.priceCents + value.extraCents)}`;
  return value.extraCents ? `${value.label} (+${money(value.extraCents)})` : value.label;
}

/** Line description for a quote/invoice: name, chosen options, then any standard description. */
export function catalogLineDescription(item: Pick<CatalogItem, "name" | "options" | "description">, choices: number[]) {
  const picked = item.options.map((option, index) => `${option.name}: ${option.values[choices[index] ?? 0]?.label ?? ""}`).filter((text) => !text.endsWith(": "));
  return [item.name, picked.join(" · "), item.description].filter(Boolean).join("\n");
}
