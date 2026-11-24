"use client";

import { useMemo, useState } from "react";
import type { CatalogItem } from "@/lib/catalog-types";
import { MAX_STICKER_MM, MIN_STICKER_MM, STICKER_SHAPES, customStickerPrice, perM2Text, ratePricedText, stickerPriceAtRate, stickerPricePerM2, stickerDesignOptions, stickerQuantities, stickerReferences, type StickerShape } from "@/lib/custom-sticker";
import type { PickedLine } from "./catalog-picker";
import { StickerRatePicker } from "./sticker-rate-picker";

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
  const [showRate, setShowRate] = useState(false);
  // 0 = price list; otherwise a set per m² rate (cents) chosen by staff.
  const [rateCents, setRateCents] = useState(0);

  const w = Number(width), h = shape === "Rectangle" ? Number(height) : Number(width);
  const sizeError = (value: number) => value && (value < MIN_STICKER_MM || value > MAX_STICKER_MM) ? `Sizes from ${MIN_STICKER_MM} to ${MAX_STICKER_MM} mm.` : "";
  const error = sizeError(w) || (shape === "Rectangle" ? sizeError(h) : "");
  const price = !error && w && h ? customStickerPrice(references, w, h, quantity) : null;
  const designExtra = designs[design]?.extraCents ?? 0;
  // Price list: interpolated from the standard sizes. Per m² rate: rate × printed area. Design service on top of either.
  const printCents = rateCents ? (!error && w && h ? stickerPriceAtRate(rateCents, w, h, quantity) : 0) : price?.cents ?? 0;
  const total = printCents ? printCents + designExtra : 0;
  // Price per m² of print (design service left out): for comparing with roll-priced vinyl.
  const rate = printCents ? stickerPricePerM2(printCents, w, h, quantity) : null;
  const sizeText = shape === "Circle" ? `${w} mm diameter` : `${w} x ${h} mm`;

  if (!references.length) return <div className="cat-detail"><button type="button" className="cat-back" onClick={onBack}>← Back to products</button><p className="admin-hint">Add standard sticker sizes to the catalog first; custom sizes are priced from them.</p></div>;

  return <div className="cat-detail">
    <button type="button" className="cat-back" onClick={onBack}>← Back to products</button>
    <h3>Custom size sticker</h3>
    <p className="admin-hint">Priced from the {references.length} standard sticker sizes by area for the chosen quantity, or at a set rate per m² of print.</p>
    <div className="field"><label htmlFor="cs-shape">Shape</label><select id="cs-shape" value={shape} onChange={(event) => setShape(event.target.value as StickerShape)}>{STICKER_SHAPES.map((name) => <option key={name}>{name}</option>)}</select></div>
    <div className="cs-size">
      <div className="field"><label htmlFor="cs-width">{shape === "Circle" ? "Diameter (mm)" : shape === "Square" ? "Side (mm)" : "Width (mm)"}</label><input id="cs-width" inputMode="numeric" value={width} onChange={(event) => setWidth(event.target.value.replace(/[^\d]/g, ""))} placeholder="e.g. 75" /></div>
      {shape === "Rectangle" && <><span aria-hidden>×</span><div className="field"><label htmlFor="cs-height">Height (mm)</label><input id="cs-height" inputMode="numeric" value={height} onChange={(event) => setHeight(event.target.value.replace(/[^\d]/g, ""))} placeholder="e.g. 130" /></div></>}
    </div>
    <div className="field"><label htmlFor="cs-qty">Quantity</label><select id="cs-qty" value={quantity} onChange={(event) => setQuantity(event.target.value)}>{quantities.map((label) => <option key={label} value={label}>{label}</option>)}</select></div>
    {designs.length > 0 && <div className="field"><label htmlFor="cs-design">Designing</label><select id="cs-design" value={design} onChange={(event) => setDesign(Number(event.target.value))}>{designs.map((value, index) => <option key={value.label} value={index}>{value.label}{value.extraCents ? ` (+${money(value.extraCents)})` : ""}</option>)}</select></div>}
    <StickerRatePicker value={rateCents} onChange={setRateCents} />
    {error && <p className="admin-error" role="alert">{error}</p>}
    {total > 0 && <div className="cat-price cs-price"><span>Price for {quantity} (ex GST)</span><b>{money(total)}</b>
      <small>{rateCents ? `${money(rateCents)} per m² × ${rate?.areaM2.toFixed(2)} m²` : price?.basis}{designExtra ? ` · includes ${money(designExtra)} design` : ""}</small>
      {rate && !rateCents && <small className="cs-rate"><b>{money(rate.cents)} per m²</b> of print ({rate.count} × {sizeText} = {rate.areaM2.toFixed(2)} m²{designExtra ? ", design not included" : ""})</small>}</div>}
    {rate && !rateCents && <label className="cat-show-diagram"><input type="checkbox" checked={showRate} onChange={(event) => setShowRate(event.target.checked)} /> Show the per m² price on the {kind}</label>}
    {!rateCents && price?.warning && <p className="uploader-notice cs-warning" role="status">{price.warning}</p>}
    <button type="button" className="button button-orange" disabled={!total} onClick={() => total && onAdd({
      // A rate-priced run always carries its rate on the line (the customer sees it, and the server re-checks the price from it).
      description: `Custom ${shape} Sticker - ${sizeText}\nQuantity: ${quantity}${designs[design] ? ` · Designing: ${designs[design].label}` : ""}${rateCents ? `\n${ratePricedText(rateCents, money)}` : showRate && rate ? `\n${perM2Text(rate, money)}` : ""}`,
      qty: 1, unitCents: total,
    })}>Add to {kind}</button>
  </div>;
}
