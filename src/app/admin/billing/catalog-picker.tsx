"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";
import { catalogLineDescription, catalogPrice, optionValueLabel, rollPrice, rollUsage, type CatalogItem } from "@/lib/catalog-types";
import { CustomStickerForm } from "./custom-sticker-form";
import { RollPlan, VinylMixForm } from "./vinyl-mix-form";
import { OffcutOffer, offcutLine, type OffcutPlan } from "./offcut-offer";
import { JOINS_AGREED, joinsText, largestOffcut, layoutOnRoll, piecesText, VINYL_GAP_MM, type VinylPiece } from "@/lib/vinyl-nest";
import { perM2Text, ratePricedText, sizeFromName, stickerPriceAtRate, stickerPricePerM2 } from "@/lib/custom-sticker";
import { StickerRatePicker } from "./sticker-rate-picker";
import { LetterSignForm } from "./letter-sign-form";
import { AcpSignForm } from "./acp-sign-form";
import { CustomLightboxForm } from "./custom-lightbox-form";
import { FrameColourField } from "./frame-colour-field";
import { DEFAULT_FRAME_COLOUR, frameColourLine } from "@/lib/lightboxes";
import { RollDiagram } from "@/components/billing/roll-diagram";

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
import type { RollDetails } from "@/lib/billing";
export type PickedLine = { description: string; qty: number; unitCents: number; roll?: RollDetails; code?: string; production?: string; acp?: { widthMm: number; heightMm: number; signs?: number; showDiagram?: boolean; panelSet?: string } };

/**
 * "Add from catalog" for the quote/invoice editor: search or browse by category, choose the product's
 * options (quantity, design service…), see the price update, then add it as a line (still editable after).
 */
export function CatalogPicker({ items, kind, onAdd, onClose }: { items: CatalogItem[]; kind: "quote" | "invoice"; onAdd: (line: PickedLine) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [customSticker, setCustomSticker] = useState(false);
  const [vinylMix, setVinylMix] = useState(false);
  const [letterSign, setLetterSign] = useState(false);
  const [acpSign, setAcpSign] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [frameColour, setFrameColour] = useState(DEFAULT_FRAME_COLOUR);
  const [choices, setChoices] = useState<number[]>([]);
  const [qty, setQty] = useState("1");
  const [size, setSize] = useState({ width: "", height: "" });
  const [showDiagram, setShowDiagram] = useState(false);
  // Roll products can take several sizes for the same client: all nested on one roll and charged once for the roll used.
  const [moreSizes, setMoreSizes] = useState<{ key: number; width: string; height: string; qty: string }[]>([]);
  // Client agrees to joins: long stickers are cut into roll-width sections (laid out like mixed sizes).
  const [joins, setJoins] = useState(false);
  const [useOffcut, setUseOffcut] = useState(false);
  const [offcutPlan, setOffcutPlan] = useState<OffcutPlan>({ pieces: [], layout: null });
  const [added, setAdded] = useState("");

  // "3D Letters" is always offered: letter signs are built in the configurator, extras come from the catalog.
  const categories = useMemo(() => [...new Set([...items.map((item) => item.category), "3D Letters"])], [items]);
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const subcategories = category ? [...new Set(items.filter((item) => item.category === category).map((item) => item.subcategory).filter(Boolean))] : [];
  const shown = items.filter((item) => (!category || item.category === category) && (!subcategory || item.subcategory === subcategory) && words.every((word) => `${item.name} ${item.category} ${item.subcategory}`.toLowerCase().includes(word)));

  // Offer the custom-size sticker when browsing stickers or searching for one.
  const showLightbox = category === "Lightboxes" || (!category && words.length > 0 && words.every((word) => "custom size light box lightbox lightboxes illuminated".includes(word)));
  const showAcpSign = category === "ACP Panels" || (!category && words.length > 0 && words.every((word) => "acp panel panels sign signage board printed laminated".includes(word)));
  const showLetterSign = category === "3D Letters" || (!category && words.length > 0 && words.every((word) => "3d letter letters sign signage 3dl channel".includes(word)));
  // Mixed-size vinyl stickers cut from one roll: with the stickers, or when searching for vinyl / roll / mixed.
  const showVinylMix = category === "Stickers" || (!category && words.length > 0 && words.every((word) => "vinyl sticker stickers mixed sizes roll multiple different cut".includes(word)));
  const showCustomSticker = items.some((item) => item.category === "Stickers") && (category === "Stickers" || (!category && words.length > 0 && words.every((word) => "custom size sticker stickers".includes(word))));
  const pick = (item: CatalogItem) => { setRateCents(0); setShowRate(false); setSelected(item); setChoices(item.options.map(() => 0)); setQty("1"); setSize({ width: "", height: "" }); setMoreSizes([]); setJoins(false); setUseOffcut(false); setOffcutPlan({ pieces: [], layout: null }); setShowDiagram(false); setAdded(""); setFrameColour(DEFAULT_FRAME_COLOUR); };
  // Roll-priced products (e.g. vinyl stickers): charged for the vinyl roll used, any size.
  const byArea = selected?.pricing === "roll";
  const widthMm = Number(size.width) || 0, heightMm = Number(size.height) || 0;
  const sizeOk = widthMm >= 10 && heightMm >= 10 && widthMm <= 20000 && heightMm <= 20000;
  const usage = selected && sizeOk ? rollUsage(widthMm, heightMm, selected.rollWidthMm) : null;
  // Mixed sizes: the first size (× its pieces) plus every added size, laid out together on the product's roll.
  const mixed = byArea && (moreSizes.length > 0 || joins);
  const mixPieces: VinylPiece[] = !mixed ? [] : [{ widthMm, heightMm, qty: Math.max(0, Math.floor(Number(qty) || 0)) }, ...moreSizes.map((row) => ({ widthMm: Number(row.width) || 0, heightMm: Number(row.height) || 0, qty: Number(row.qty) || 0 }))].filter((piece) => piece.widthMm > 0 && piece.heightMm > 0 && piece.qty > 0);
  const mixTooBig = mixed && selected && !joins ? mixPieces.find((piece) => Math.min(piece.widthMm, piece.heightMm) > selected.rollWidthMm) : undefined;
  const mixLayout = mixed && selected && sizeOk && !mixTooBig && mixPieces.length ? layoutOnRoll(mixPieces, selected.rollWidthMm, VINYL_GAP_MM, joins) : null;
  // Roll the client pays for but doesn't use (one sticker, or the mixed layout): offered for printing only.
  const singleLayout = byArea && !mixed && selected && sizeOk && Math.floor(Number(qty) || 0) === 1 && Math.min(widthMm, heightMm) <= selected.rollWidthMm ? layoutOnRoll([{ widthMm, heightMm, qty: 1 }], selected.rollWidthMm) : null;
  const offcut = mixLayout ? largestOffcut(mixLayout) : singleLayout ? largestOffcut(singleLayout) : null;
  const listUnit = !selected ? 0 : mixed ? (mixLayout ? Math.round(selected.priceCents * mixLayout.areaM2) + catalogPrice({ priceCents: 0, options: selected.options }, choices) : 0)
    : byArea ? (sizeOk ? rollPrice(selected, widthMm, heightMm, choices) : 0) : catalogPrice(selected, choices);
  const quantity = Math.max(Number(qty) || 0, 0);
  // Standard stickers: price per m² of print for the chosen run (design service left out), to compare with vinyl by the m².
  const stickerSize = selected?.category === "Stickers" ? sizeFromName(selected.name) : null;
  const runIndex = selected ? selected.options.findIndex((option) => option.name.toLowerCase() === "quantity") : -1;
  const designIndex = selected ? selected.options.findIndex((option) => option.name.toLowerCase() === "designing") : -1;
  const designCents = selected && designIndex >= 0 ? selected.options[designIndex].values[choices[designIndex] ?? 0]?.extraCents ?? 0 : 0;
  const runLabel = selected && runIndex >= 0 ? selected.options[runIndex].values[choices[runIndex] ?? 0]?.label ?? "" : "";
  // Staff can price a standard sticker run at a set per m² rate instead of the price list (0 = price list).
  const [rateCents, setRateCents] = useState(0);
  const atRate = !!(rateCents && stickerSize && runIndex >= 0);
  const unit = atRate ? stickerPriceAtRate(rateCents, stickerSize![0], stickerSize![1], runLabel) + designCents : listUnit;
  const stickerRate = selected && stickerSize && runIndex >= 0 ? stickerPricePerM2(unit - designCents, stickerSize[0], stickerSize[1], runLabel) : null;
  const [showRate, setShowRate] = useState(false);

  const addCustom = (line: PickedLine) => { onAdd(line); setAdded(`Added: ${line.code ?? line.description.split("\n")[0]}`); setCustomSticker(false); setVinylMix(false); setLetterSign(false); setAcpSign(false); setLightbox(false); };

  function add() {
    if (!selected || quantity <= 0 || (byArea && !sizeOk) || (mixed && !mixLayout) || (byArea && useOffcut && offcut && !offcutPlan.layout)) return;
    if (mixed && mixLayout) {
      // One line for every size: priced from the roll used, at the product's own rate per m².
      onAdd({
        description: `${selected.name}\nPieces: ${piecesText(mixPieces)}\nCut from a ${selected.rollWidthMm} mm roll: ${mixLayout.lengthMm} mm used (${mixLayout.areaM2.toFixed(3)} m²) at ${money(selected.priceCents)} per m²${joinsText(mixLayout) ? `\n${JOINS_AGREED}: ${joinsText(mixLayout)}` : ""}${selected.description ? `\n${selected.description}` : ""}`,
        qty: 1, unitCents: unit, ...(selected.code ? { code: selected.code } : {}),
        production: [selected.production, `Mixed sizes: ${piecesText(mixPieces)}`, `Nest on the ${selected.rollWidthMm} mm roll, ${VINYL_GAP_MM} mm gaps: ${mixLayout.lengthMm} mm of roll${mixLayout.placements.some((item) => item.rotated) ? " (some pieces rotated)" : ""}`, joinsText(mixLayout) ? `JOINS (client agreed): ${joinsText(mixLayout)}` : ""].filter(Boolean).join("\n"),
      });
      if (useOffcut && offcut && offcutPlan.layout) onAdd(offcutLine(offcut, selected.name, selected.rollWidthMm, offcutPlan));
      setAdded(`Added: ${selected.name} (${mixLayout.count} pieces)`);
      setSelected(null);
      return;
    }
    const base = catalogLineDescription(selected, choices);
    // The customer sees the finished size only; how much roll it uses is an internal costing detail.
    const sized = byArea ? base.replace(selected.name, `${selected.name}\nSize: ${widthMm} x ${heightMm} mm`) : base;
    // Lightboxes carry their frame colour on the line and on the job sheet.
    const lightboxItem = selected.category === "Lightboxes";
    const withFrame = lightboxItem ? `${sized}\n${frameColourLine(frameColour)}` : sized;
    // A rate-priced run always carries its rate (shown to the customer, and the server re-checks the price from it).
    const description = atRate ? `${withFrame}\n${ratePricedText(rateCents, money)}` : showRate && stickerRate ? `${withFrame}\n${perM2Text(stickerRate, money)}` : withFrame;
    const production = [selected.production, lightboxItem ? frameColourLine(frameColour) : ""].filter(Boolean).join("\n");
    onAdd({ description, qty: quantity, unitCents: unit, ...(selected.code ? { code: selected.code } : {}), ...(production ? { production } : {}), ...(byArea ? { roll: { widthMm, heightMm, rollWidthMm: selected.rollWidthMm, pricePerM2Cents: selected.priceCents, showDiagram } } : {}) });
    if (useOffcut && offcut && offcutPlan.layout) onAdd(offcutLine(offcut, selected.name, selected.rollWidthMm, offcutPlan));
    setAdded(`Added: ${selected.name}`);
    setSelected(null);
  }

  return <div className="cat-picker" role="dialog" aria-label="Add from catalog">
    <div className="cat-head">
      <b>Add from catalog</b><small>{items.length} products · prices ex GST</small>
      <button type="button" className="cat-close" onClick={onClose} aria-label="Close catalog"><X aria-hidden /></button>
    </div>
    {lightbox ? <CustomLightboxForm kind={kind} onAdd={addCustom} onBack={() => setLightbox(false)} /> : acpSign ? <AcpSignForm kind={kind} onAdd={addCustom} onBack={() => setAcpSign(false)} /> : letterSign ? <LetterSignForm kind={kind} onAdd={addCustom} onBack={() => setLetterSign(false)} /> : customSticker ? <CustomStickerForm items={items} kind={kind} onAdd={addCustom} onBack={() => setCustomSticker(false)} /> : vinylMix ? <VinylMixForm kind={kind} onAdd={addCustom} onBack={() => setVinylMix(false)} /> : !selected ? <>
      <label className="cat-search"><Search aria-hidden /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search e.g. business cards velvet, A5 flyer, corflute 600x900" aria-label="Search the catalog" /></label>
      <div className="cat-chips" role="group" aria-label="Categories"><button type="button" aria-pressed={!category} onClick={() => { setCategory(""); setSubcategory(""); }}>All</button>{categories.map((name) => <button type="button" key={name} aria-pressed={category === name} onClick={() => { setCategory(name); setSubcategory(""); setQuery(""); }}>{name}</button>)}</div>
      {subcategories.length > 0 && <div className="cat-chips cat-subchips" role="group" aria-label={`${category} types`}><button type="button" aria-pressed={!subcategory} onClick={() => setSubcategory("")}>All {category.toLowerCase()}</button>{subcategories.map((name) => <button type="button" key={name} aria-pressed={subcategory === name} onClick={() => setSubcategory(name)}>{name}</button>)}</div>}
      {added && <p className="admin-ok cat-added" role="status">{added}. Pick another product or close the catalog.</p>}
      {showLightbox && <button type="button" className="cat-custom" onClick={() => { setLightbox(true); setAdded(""); }}><b>Custom size lightbox</b><small>Round, square or rectangular in any size (mm), priced from the lightbox price list.</small><em>Price by size →</em></button>}
      {showAcpSign && <button type="button" className="cat-custom" onClick={() => { setAcpSign(true); setAdded(""); }}><b>ACP sign, any size (vinyl printed &amp; laminated)</b><small>Enter the size; the cheapest combination of panels is worked out, with a layout diagram.</small><em>Calculate →</em></button>}
      {showLetterSign && <button type="button" className="cat-custom" onClick={() => { setLetterSign(true); setAdded(""); }}><b>3D letter sign builder</b><small>Ready-made builds or custom, priced per letter by height. Writes the product code for client and production.</small><em>Build →</em></button>}
      {showVinylMix && <button type="button" className="cat-custom" onClick={() => { setVinylMix(true); setAdded(""); }}><b>Vinyl stickers: mixed sizes</b><small>Several sizes cut from one roll, charged for the roll used at a rate per m²</small><em>Lay out on roll →</em></button>}
      {showCustomSticker && <button type="button" className="cat-custom" onClick={() => { setCustomSticker(true); setAdded(""); }}><b>Custom size sticker</b><small>Any shape and size in mm, priced from the standard sticker range</small><em>Price by size →</em></button>}
      <ul className="cat-list">{shown.map((item) => <li key={item.id}><button type="button" onClick={() => pick(item)}>
        <span><b>{item.name}</b><small>{item.pricing === "roll" ? "Price per m² · enter size · " : ""}{item.category}{item.subcategory ? ` › ${item.subcategory}` : ""}{item.options.length ? ` · ${item.options.map((option) => option.name).join(", ")}` : ""}</small></span>
        <em>{item.options.length ? "from " : ""}{money(item.priceCents)}{item.pricing === "roll" ? "/m²" : ""}</em>
      </button></li>)}</ul>
      {shown.length === 0 && <p className="admin-hint">No products match. Try fewer words, or add a custom line instead.</p>}
    </> : <div className="cat-detail">
      <button type="button" className="cat-back" onClick={() => setSelected(null)}>← Back to products</button>
      <h3>{selected.name}</h3><p className="admin-hint">{selected.category}{selected.subcategory ? ` › ${selected.subcategory}` : ""} · {byArea ? `${money(selected.priceCents)} per m² ex GST` : `${selected.options.some((option) => option.name.toLowerCase() === "quantity") ? "from" : "base price"} ${money(selected.priceCents)} ex GST`}</p>
      {selected.options.map((option, index) => <div className="field" key={option.name}><label htmlFor={`cat-opt-${index}`}>{option.name}</label>
        <select id={`cat-opt-${index}`} value={choices[index] ?? 0} onChange={(event) => setChoices((current) => current.map((value, i) => (i === index ? Number(event.target.value) : value)))}>
          {option.values.map((value, valueIndex) => <option key={value.label} value={valueIndex}>{optionValueLabel(selected, option, value, money)}</option>)}
        </select></div>)}
      {stickerSize && runIndex >= 0 && <StickerRatePicker value={rateCents} onChange={setRateCents} />}
      {selected.category === "Lightboxes" && <FrameColourField id="cat-frame" value={frameColour} onChange={setFrameColour} />}
      {byArea && <div className="cs-size">
        <div className="field"><label htmlFor="cat-w">Width (mm)</label><input id="cat-w" inputMode="numeric" value={size.width} onChange={(event) => setSize((current) => ({ ...current, width: event.target.value.replace(/[^\d]/g, "") }))} placeholder="e.g. 2000" /></div>
        <span aria-hidden>×</span>
        <div className="field"><label htmlFor="cat-h">Height (mm)</label><input id="cat-h" inputMode="numeric" value={size.height} onChange={(event) => setSize((current) => ({ ...current, height: event.target.value.replace(/[^\d]/g, "") }))} placeholder="e.g. 1500" /></div>
      </div>}
      {byArea && (widthMm || heightMm) > 0 && !sizeOk && <p className="admin-error">Enter both sides, from 10 mm to 20,000 mm.</p>}
      {mixed && moreSizes.length > 0 && <div className="vm-rows">
        <div className="vm-row vm-head"><span>More sizes · width (mm)</span><span>Height (mm)</span><span>Pieces</span><span /></div>
        {moreSizes.map((row, index) => <div className="vm-row" key={row.key}>
          <input aria-label={`Size ${index + 2} width`} inputMode="numeric" value={row.width} onChange={(event) => setMoreSizes((current) => current.map((item) => item.key === row.key ? { ...item, width: event.target.value.replace(/[^\d]/g, "").slice(0, 5) } : item))} placeholder="200" />
          <input aria-label={`Size ${index + 2} height`} inputMode="numeric" value={row.height} onChange={(event) => setMoreSizes((current) => current.map((item) => item.key === row.key ? { ...item, height: event.target.value.replace(/[^\d]/g, "").slice(0, 5) } : item))} placeholder="200" />
          <input aria-label={`Size ${index + 2} pieces`} inputMode="numeric" value={row.qty} onChange={(event) => setMoreSizes((current) => current.map((item) => item.key === row.key ? { ...item, qty: event.target.value.replace(/[^\d]/g, "").slice(0, 3) } : item))} placeholder="1" />
          <button type="button" className="bill-remove" aria-label={`Remove size ${index + 2}`} onClick={() => setMoreSizes((current) => current.filter((item) => item.key !== row.key))}><Trash2 aria-hidden /></button>
        </div>)}
      </div>}
      {byArea && <label className={`cat-show-diagram vm-joins${[{ w: widthMm, h: heightMm }, ...moreSizes.map((row) => ({ w: Number(row.width) || 0, h: Number(row.height) || 0 }))].some((size) => Math.max(size.w, size.h) > selected.rollWidthMm) ? " is-relevant" : ""}`}><input type="checkbox" checked={joins} onChange={(event) => setJoins(event.target.checked)} /> Client agrees to joins <small>Stickers longer than the {selected.rollWidthMm} mm roll are cut into {selected.rollWidthMm} mm sections and joined, so they use much less roll (e.g. 1700 × 200 → 1500 + 200).</small></label>}
      {byArea && <button type="button" className="bill-add" onClick={() => setMoreSizes((current) => [...current, { key: Date.now(), width: "", height: "", qty: "1" }])}><Plus aria-hidden /> Add another size (same material, one roll)</button>}
      {mixTooBig && <p className="admin-error" role="alert">{mixTooBig.widthMm} × {mixTooBig.heightMm} mm is wider than the {selected.rollWidthMm} mm roll both ways. Add it as its own line (it's joined from strips).</p>}
      {mixLayout && <><RollPlan layout={mixLayout} pieces={mixPieces} /><p className="cat-area">Roll used: <b>{selected.rollWidthMm} × {mixLayout.lengthMm} mm</b> = <b>{mixLayout.areaM2.toFixed(3)} m²</b> × {money(selected.priceCents)}/m² for {mixPieces.reduce((sum, piece) => sum + piece.qty, 0) === 1 ? "the sticker" : `all ${mixPieces.reduce((sum, piece) => sum + piece.qty, 0)} stickers`}{mixLayout.count > mixPieces.reduce((sum, piece) => sum + piece.qty, 0) ? ` (${mixLayout.count} sections)` : ""}{joinsText(mixLayout) ? ` · joined: ${joinsText(mixLayout)}` : ""}</p></>}
      {byArea && !mixed && usage && <p className="cat-area">Vinyl used: <b>{usage.strips === 1 ? `${usage.rollWidthMm} × ${usage.lengthMm} mm` : `${usage.strips} strips of ${usage.rollWidthMm} × ${usage.lengthMm} mm (joined)`}</b> = <b>{usage.areaM2.toFixed(2)} m²</b> × {money(selected.priceCents)}/m² = <b>{money(Math.round(selected.priceCents * usage.areaM2))}</b><small>{usage.rollWidthMm} mm roll. Shown to the customer only if you tick the box below.</small></p>}
      {byArea && !mixed && usage && selected && <RollDiagram widthMm={widthMm} heightMm={heightMm} rollWidthMm={selected.rollWidthMm} pricePerM2Cents={selected.priceCents} />}
      {byArea && !mixed && usage && <label className="cat-show-diagram"><input type="checkbox" checked={showDiagram} onChange={(event) => setShowDiagram(event.target.checked)} /> Show this roll diagram to the customer on the {kind} (online and PDF)</label>}
      <div className="field cat-qty"><label htmlFor="cat-qty">{mixed ? "Pieces of the first size" : byArea ? "Number of pieces" : "Line quantity"}</label><input id="cat-qty" inputMode="decimal" value={qty} onChange={(event) => setQty(event.target.value)} />
        <small>{selected.options.some((option) => option.name.toLowerCase() === "quantity") ? "The Quantity option above is the print run; keep this at 1 unless you want several runs." : mixed ? `How many of the first size (${widthMm || "?"} × ${heightMm || "?"} mm). The other sizes have their own pieces above.` : "How many of this product."}</small></div>
      <div className="cat-price"><span>{mixed ? "Price for all sizes (ex GST)" : byArea ? "Price per piece (ex GST)" : "Unit price (ex GST)"}</span><b>{money(unit)}</b>{quantity !== 1 && !mixed && <small>{quantity} × {money(unit)} = {money(Math.round(unit * quantity))}</small>}
        {stickerRate && stickerSize && <small className="cs-rate"><b>{money(stickerRate.cents)} per m²</b> of print ({stickerRate.count} × {stickerSize[0]} × {stickerSize[1]} mm = {stickerRate.areaM2.toFixed(2)} m²{designIndex >= 0 && (selected.options[designIndex].values[choices[designIndex] ?? 0]?.extraCents ?? 0) > 0 ? ", design not included" : ""})</small>}</div>
      {stickerRate && !atRate && <label className="cat-show-diagram"><input type="checkbox" checked={showRate} onChange={(event) => setShowRate(event.target.checked)} /> Show the per m² price on the {kind}</label>}
      {byArea && offcut && <OffcutOffer key={`${offcut.widthMm}x${offcut.lengthMm}`} offcut={offcut} checked={useOffcut} onChange={setUseOffcut} onPlan={setOffcutPlan} />}
      <button type="button" className="button button-orange" onClick={add} disabled={quantity <= 0 || (byArea && !sizeOk) || (mixed && !mixLayout) || (byArea && useOffcut && !!offcut && !offcutPlan.layout)}>Add to {kind}</button>
    </div>}
  </div>;
}
