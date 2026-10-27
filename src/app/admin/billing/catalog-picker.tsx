"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { catalogLineDescription, catalogPrice, optionValueLabel, rollPrice, rollUsage, type CatalogItem } from "@/lib/catalog-types";
import { CustomStickerForm } from "./custom-sticker-form";
import { LetterSignForm } from "./letter-sign-form";
import { AcpSignForm } from "./acp-sign-form";
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
  const [letterSign, setLetterSign] = useState(false);
  const [acpSign, setAcpSign] = useState(false);
  const [choices, setChoices] = useState<number[]>([]);
  const [qty, setQty] = useState("1");
  const [size, setSize] = useState({ width: "", height: "" });
  const [showDiagram, setShowDiagram] = useState(false);
  const [added, setAdded] = useState("");

  // "3D Letters" is always offered: letter signs are built in the configurator, extras come from the catalog.
  const categories = useMemo(() => [...new Set([...items.map((item) => item.category), "3D Letters"])], [items]);
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const subcategories = category ? [...new Set(items.filter((item) => item.category === category).map((item) => item.subcategory).filter(Boolean))] : [];
  const shown = items.filter((item) => (!category || item.category === category) && (!subcategory || item.subcategory === subcategory) && words.every((word) => `${item.name} ${item.category} ${item.subcategory}`.toLowerCase().includes(word)));

  // Offer the custom-size sticker when browsing stickers or searching for one.
  const showAcpSign = category === "ACP Panels" || (!category && words.length > 0 && words.every((word) => "acp panel panels sign signage board printed laminated".includes(word)));
  const showLetterSign = category === "3D Letters" || (!category && words.length > 0 && words.every((word) => "3d letter letters sign signage 3dl channel".includes(word)));
  const showCustomSticker = items.some((item) => item.category === "Stickers") && (category === "Stickers" || (!category && words.length > 0 && words.every((word) => "custom size sticker stickers".includes(word))));
  const pick = (item: CatalogItem) => { setSelected(item); setChoices(item.options.map(() => 0)); setQty("1"); setSize({ width: "", height: "" }); setShowDiagram(false); setAdded(""); };
  // Roll-priced products (e.g. vinyl stickers): charged for the vinyl roll used, any size.
  const byArea = selected?.pricing === "roll";
  const widthMm = Number(size.width) || 0, heightMm = Number(size.height) || 0;
  const sizeOk = widthMm >= 10 && heightMm >= 10 && widthMm <= 20000 && heightMm <= 20000;
  const usage = selected && sizeOk ? rollUsage(widthMm, heightMm, selected.rollWidthMm) : null;
  const unit = !selected ? 0 : byArea ? (sizeOk ? rollPrice(selected, widthMm, heightMm, choices) : 0) : catalogPrice(selected, choices);
  const quantity = Math.max(Number(qty) || 0, 0);

  const addCustom = (line: PickedLine) => { onAdd(line); setAdded(`Added: ${line.code ?? line.description.split("\n")[0]}`); setCustomSticker(false); setLetterSign(false); setAcpSign(false); };

  function add() {
    if (!selected || quantity <= 0 || (byArea && !sizeOk)) return;
    const base = catalogLineDescription(selected, choices);
    // The customer sees the finished size only; how much roll it uses is an internal costing detail.
    const description = byArea ? base.replace(selected.name, `${selected.name}\nSize: ${widthMm} x ${heightMm} mm`) : base;
    onAdd({ description, qty: quantity, unitCents: unit, ...(selected.code ? { code: selected.code } : {}), ...(selected.production ? { production: selected.production } : {}), ...(byArea ? { roll: { widthMm, heightMm, rollWidthMm: selected.rollWidthMm, pricePerM2Cents: selected.priceCents, showDiagram } } : {}) });
    setAdded(`Added: ${selected.name}`);
    setSelected(null);
  }

  return <div className="cat-picker" role="dialog" aria-label="Add from catalog">
    <div className="cat-head">
      <b>Add from catalog</b><small>{items.length} products · prices ex GST</small>
      <button type="button" className="cat-close" onClick={onClose} aria-label="Close catalog"><X aria-hidden /></button>
    </div>
    {acpSign ? <AcpSignForm kind={kind} onAdd={addCustom} onBack={() => setAcpSign(false)} /> : letterSign ? <LetterSignForm kind={kind} onAdd={addCustom} onBack={() => setLetterSign(false)} /> : customSticker ? <CustomStickerForm items={items} kind={kind} onAdd={addCustom} onBack={() => setCustomSticker(false)} /> : !selected ? <>
      <label className="cat-search"><Search aria-hidden /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search e.g. business cards velvet, A5 flyer, corflute 600x900" aria-label="Search the catalog" /></label>
      <div className="cat-chips" role="group" aria-label="Categories"><button type="button" aria-pressed={!category} onClick={() => { setCategory(""); setSubcategory(""); }}>All</button>{categories.map((name) => <button type="button" key={name} aria-pressed={category === name} onClick={() => { setCategory(name); setSubcategory(""); setQuery(""); }}>{name}</button>)}</div>
      {subcategories.length > 0 && <div className="cat-chips cat-subchips" role="group" aria-label={`${category} types`}><button type="button" aria-pressed={!subcategory} onClick={() => setSubcategory("")}>All {category.toLowerCase()}</button>{subcategories.map((name) => <button type="button" key={name} aria-pressed={subcategory === name} onClick={() => setSubcategory(name)}>{name}</button>)}</div>}
      {added && <p className="admin-ok cat-added" role="status">{added}. Pick another product or close the catalog.</p>}
      {showAcpSign && <button type="button" className="cat-custom" onClick={() => { setAcpSign(true); setAdded(""); }}><b>ACP sign, any size (vinyl printed &amp; laminated)</b><small>Enter the size; the cheapest combination of panels is worked out, with a layout diagram.</small><em>Calculate →</em></button>}
      {showLetterSign && <button type="button" className="cat-custom" onClick={() => { setLetterSign(true); setAdded(""); }}><b>3D letter sign builder</b><small>Ready-made builds or custom, priced per letter by height. Writes the product code for client and production.</small><em>Build →</em></button>}
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
      {byArea && <div className="cs-size">
        <div className="field"><label htmlFor="cat-w">Width (mm)</label><input id="cat-w" inputMode="numeric" value={size.width} onChange={(event) => setSize((current) => ({ ...current, width: event.target.value.replace(/[^\d]/g, "") }))} placeholder="e.g. 2000" /></div>
        <span aria-hidden>×</span>
        <div className="field"><label htmlFor="cat-h">Height (mm)</label><input id="cat-h" inputMode="numeric" value={size.height} onChange={(event) => setSize((current) => ({ ...current, height: event.target.value.replace(/[^\d]/g, "") }))} placeholder="e.g. 1500" /></div>
      </div>}
      {byArea && (widthMm || heightMm) > 0 && !sizeOk && <p className="admin-error">Enter both sides, from 10 mm to 20,000 mm.</p>}
      {byArea && usage && <p className="cat-area">Vinyl used: <b>{usage.strips === 1 ? `${usage.rollWidthMm} × ${usage.lengthMm} mm` : `${usage.strips} strips of ${usage.rollWidthMm} × ${usage.lengthMm} mm (joined)`}</b> = <b>{usage.areaM2.toFixed(2)} m²</b> × {money(selected.priceCents)}/m² = <b>{money(Math.round(selected.priceCents * usage.areaM2))}</b><small>{usage.rollWidthMm} mm roll. Shown to the customer only if you tick the box below.</small></p>}
      {byArea && usage && selected && <RollDiagram widthMm={widthMm} heightMm={heightMm} rollWidthMm={selected.rollWidthMm} pricePerM2Cents={selected.priceCents} />}
      {byArea && usage && <label className="cat-show-diagram"><input type="checkbox" checked={showDiagram} onChange={(event) => setShowDiagram(event.target.checked)} /> Show this roll diagram to the customer on the {kind} (online and PDF)</label>}
      <div className="field cat-qty"><label htmlFor="cat-qty">{byArea ? "Number of pieces" : "Line quantity"}</label><input id="cat-qty" inputMode="decimal" value={qty} onChange={(event) => setQty(event.target.value)} />
        <small>{selected.options.some((option) => option.name.toLowerCase() === "quantity") ? "The Quantity option above is the print run; keep this at 1 unless you want several runs." : "How many of this product."}</small></div>
      <div className="cat-price"><span>{byArea ? "Price per piece (ex GST)" : "Unit price (ex GST)"}</span><b>{money(unit)}</b>{quantity !== 1 && <small>{quantity} × {money(unit)} = {money(Math.round(unit * quantity))}</small>}</div>
      <button type="button" className="button button-orange" onClick={add} disabled={quantity <= 0 || (byArea && !sizeOk)}>Add to {kind}</button>
    </div>}
  </div>;
}
