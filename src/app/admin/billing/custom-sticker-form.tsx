"use client";

import { useMemo, useState } from "react";
import type { CatalogItem } from "@/lib/catalog-types";
import { MAX_STICKER_MM, MIN_STICKER_MM, STICKER_SHAPES, customStickerPrice, stickerDesignOptions, stickerQuantities, stickerReferences, type StickerShape } from "@/lib/custom-sticker";
import type { PickedLine } from "./catalog-picker";

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Custom-size sticker: shape + size in mm + quantity + design service, priced from the standard sticker sizes. */
export function CustomStickerForm({ items, kind, onAdd, onBack }: { items: CatalogItem[]; kind: "quote" | "invoice"; onAdd: (line: PickedLine) => void; onBack: () => void }) {
  const references = useMemo(() => stickerReferences(items), [items]);
  const quantities = useMemo(() => stickerQuantities(references), [references]);
  const designs = useMemo(() => stickerDesignOptions(items), [items]);
  const [shape, setShape] = useState<StickerShape>("Rectangle");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [quantity, setQuantity] = useState(quantities[0] ?? "");
  const [design, setDesign] = useState(0);

  const w = Number(width), h = shape === "Rectangle" ? Number(height) : Number(width);
  const sizeError = (value: number) => value && (value < MIN_STICKER_MM || value > MAX_STICKER_MM) ? `Sizes from ${MIN_STICKER_MM} to ${MAX_STICKER_MM} mm.` : "";
  const error = sizeError(w) || (shape === "Rectangle" ? sizeError(h) : "");
  const price = !error && w && h ? customStickerPrice(references, w, h, quantity) : null;
  const designExtra = designs[design]?.extraCents ?? 0;
  const total = price ? price.cents + designExtra : 0;
  const sizeText = shape === "Circle" ? `${w} mm diameter` : `${w} x ${h} mm`;

  if (!references.length) return <div className="cat-detail"><button type="button" className="cat-back" onClick={onBack}>← Back to products</button><p className="admin-hint">Add standard sticker sizes to the catalog first; custom sizes are priced from them.</p></div>;

  return <div className="cat-detail">
    <button type="button" className="cat-back" onClick={onBack}>← Back to products</button>
    <h3>Custom size sticker</h3>
    <p className="admin-hint">Priced from the {references.length} standard sticker sizes by area, for the chosen quantity.</p>
    <div className="field"><label htmlFor="cs-shape">Shape</label><select id="cs-shape" value={shape} onChange={(event) => setShape(event.target.value as StickerShape)}>{STICKER_SHAPES.map((name) => <option key={name}>{name}</option>)}</select></div>
    <div className="cs-size">
      <div className="field"><label htmlFor="cs-width">{shape === "Circle" ? "Diameter (mm)" : shape === "Square" ? "Side (mm)" : "Width (mm)"}</label><input id="cs-width" inputMode="numeric" value={width} onChange={(event) => setWidth(event.target.value.replace(/[^\d]/g, ""))} placeholder="e.g. 75" /></div>
      {shape === "Rectangle" && <><span aria-hidden>×</span><div className="field"><label htmlFor="cs-height">Height (mm)</label><input id="cs-height" inputMode="numeric" value={height} onChange={(event) => setHeight(event.target.value.replace(/[^\d]/g, ""))} placeholder="e.g. 130" /></div></>}
    </div>
    <div className="field"><label htmlFor="cs-qty">Quantity</label><select id="cs-qty" value={quantity} onChange={(event) => setQuantity(event.target.value)}>{quantities.map((label) => <option key={label} value={label}>{label}</option>)}</select></div>
    {designs.length > 0 && <div className="field"><label htmlFor="cs-design">Designing</label><select id="cs-design" value={design} onChange={(event) => setDesign(Number(event.target.value))}>{designs.map((value, index) => <option key={value.label} value={index}>{value.label}{value.extraCents ? ` (+${money(value.extraCents)})` : ""}</option>)}</select></div>}
    {error && <p className="admin-error" role="alert">{error}</p>}
    {price && <div className="cat-price cs-price"><span>Price for {quantity} (ex GST)</span><b>{money(total)}</b>
      <small>{price.basis}{designExtra ? ` · includes ${money(designExtra)} design` : ""}</small></div>}
    {price?.warning && <p className="uploader-notice cs-warning" role="status">{price.warning}</p>}
    <button type="button" className="button button-orange" disabled={!price} onClick={() => price && onAdd({
      description: `Custom ${shape} Sticker - ${sizeText}\nQuantity: ${quantity}${designs[design] ? ` · Designing: ${designs[design].label}` : ""}`,
      qty: 1, unitCents: total,
    })}>Add to {kind}</button>
  </div>;
}
