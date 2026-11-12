"use client";

import { useState } from "react";
import { DEFAULT_FRAME_COLOUR, frameColourLine, ROUND_STYLES, rectLightboxPrice, roundLightboxPrice, squareLightboxPrice, type LightboxShape, type RectSides, type RoundStyle } from "@/lib/lightboxes";
import type { PickedLine } from "./catalog-picker";
import { FrameColourField } from "./frame-colour-field";

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const digits = (value: string, max = 4) => value.replace(/[^\d]/g, "").slice(0, max);

/** Custom-size lightbox: shape, style and size in mm, priced from the lightbox price list (src/lib/lightboxes.ts). */
export function CustomLightboxForm({ kind, onAdd, onBack }: { kind: "quote" | "invoice"; onAdd: (line: PickedLine) => void; onBack: () => void }) {
  const [shape, setShape] = useState<LightboxShape>("Rectangular");
  const [style, setStyle] = useState<RoundStyle>("SS");
  const [sides, setSides] = useState<RectSides>("D");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [qty, setQty] = useState("1");
  const [frame, setFrame] = useState(DEFAULT_FRAME_COLOUR);
  const w = Number(width), h = Number(height);
  const quote = shape === "Round" ? (w ? roundLightboxPrice(style, w) : null) : shape === "Square" ? (w ? squareLightboxPrice(w, sides) : null) : (w && h ? rectLightboxPrice(w, h, sides) : null);
  const ok = quote && !("error" in quote) ? quote : null;
  const count = Math.max(1, Number(qty) || 1);
  const styleName = ROUND_STYLES.find((item) => item.code === style)?.name.toLowerCase() ?? "";
  const sizeText = shape === "Round" ? `Ø${w}mm · ${styleName}` : shape === "Square" ? `${w}×${w}mm · ${sides === "D" ? "double-sided" : "single-sided"}` : `${w} × ${h}mm · ${sides === "D" ? "double-sided" : "single-sided"}`;

  return <div className="cat-detail">
    <button type="button" className="cat-back" onClick={onBack}>← Back to products</button>
    <h3>Custom size lightbox</h3>
    <p className="admin-hint">Priced from the lightbox price list: rectangular by width and height, square by side, round by diameter. Single-sided rectangular and square are $50 less.</p>
    <div className="field"><label htmlFor="lb-shape">Shape</label><select id="lb-shape" value={shape} onChange={(event) => setShape(event.target.value as LightboxShape)}>{(["Rectangular", "Square", "Round"] as const).map((name) => <option key={name}>{name}</option>)}</select></div>
    {shape === "Round" && <div className="field"><label htmlFor="lb-style">Style</label><select id="lb-style" value={style} onChange={(event) => setStyle(event.target.value as RoundStyle)}>{ROUND_STYLES.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></div>}
    {shape !== "Round" && <div className="field"><label htmlFor="lb-sides">Sides</label><select id="lb-sides" value={sides} onChange={(event) => setSides(event.target.value as RectSides)}><option value="D">Double-sided</option><option value="S">Single-sided</option></select></div>}
    <div className="cs-size">
      <div className="field"><label htmlFor="lb-width">{shape === "Round" ? "Diameter (mm)" : shape === "Square" ? "Side (mm)" : "Width (mm)"}</label><input id="lb-width" inputMode="numeric" value={width} onChange={(event) => setWidth(digits(event.target.value))} placeholder={shape === "Rectangular" ? "e.g. 850" : "e.g. 550"} /></div>
      {shape === "Rectangular" && <><span aria-hidden>×</span><div className="field"><label htmlFor="lb-height">Height (mm)</label><input id="lb-height" inputMode="numeric" value={height} onChange={(event) => setHeight(digits(event.target.value))} placeholder="e.g. 500" /></div></>}
    </div>
    <FrameColourField id="lb-frame" value={frame} onChange={setFrame} />
    <div className="field"><label htmlFor="lb-qty">Quantity</label><input id="lb-qty" inputMode="numeric" value={qty} onChange={(event) => setQty(digits(event.target.value, 3))} /></div>
    {quote && "error" in quote && <p className="admin-error" role="alert">{quote.error}</p>}
    {ok && <div className="cat-price cs-price"><span>{count > 1 ? `${count} × ${money(ok.cents)} (ex GST)` : "Price each (ex GST)"}</span><b>{money(ok.cents * count)}</b><small>{ok.basis} · code {ok.code}</small></div>}
    {ok?.warning && <p className="uploader-notice cs-warning" role="status">{ok.warning}</p>}
    <button type="button" className="button button-orange" disabled={!ok} onClick={() => ok && onAdd({
      description: `Custom ${shape.toLowerCase()} lightbox · ${sizeText}\n${frameColourLine(frame)}`,
      qty: count, unitCents: ok.cents, code: ok.code,
      production: `Custom size lightbox: ${shape}, ${sizeText}. ${frameColourLine(frame)}. Priced ${ok.basis.charAt(0).toLowerCase()}${ok.basis.slice(1)}.${ok.warning ? ` CHECK: ${ok.warning}` : ""}`,
    })}>Add to {kind}</button>
  </div>;
}
