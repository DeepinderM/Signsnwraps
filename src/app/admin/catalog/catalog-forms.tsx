"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { pricingLabels, type CatalogItem } from "@/lib/catalog-types";
import { importCatalog, saveProduct } from "./actions";

const submitWithoutReset = (action: (form: FormData) => void) => (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); startTransition(() => action(form)); };

export function ImportForm({ count, hasItems }: { count: number; hasItems: boolean }) {
  const [state, action, pending] = useActionState(importCatalog, null);
  return <form onSubmit={submitWithoutReset(action)} className="cat-import">
    <div><b>{hasItems ? "Update from the Odoo product files" : `Load ${count} products from the Odoo files`}</b><small>From docs/finalproduct-oddo.xlsx and docs/stickers -oodo.xlsx. {hasItems ? "New products are added; tick the box to also refresh prices and options of existing ones." : "Prices are treated as ex GST."}</small></div>
    {hasItems && <label><input type="checkbox" name="updateExisting" /> Also update existing products</label>}
    <button className="button button-orange" type="submit" disabled={pending}>{pending ? "Importing…" : hasItems ? "Import" : "Load catalog"}</button>
    {state?.error && <p className="admin-error" role="alert">{state.error}</p>}
    {state?.ok && <p className="admin-ok" role="status">{state.ok}</p>}
  </form>;
}

type DraftOption = { key: number; name: string; values: { key: number; label: string; extra: string }[] };
let keys = 1;

/** Add or edit a catalog product, including options like Quantity or Designing with extra prices. */
export function ProductForm({ item, categories, subcategories }: { item?: CatalogItem; categories: string[]; subcategories: string[] }) {
  const [state, action, pending] = useActionState(saveProduct, null);
  // Quantity options are edited as the full price for that quantity; other options as what they add.
  const isQuantity = (name: string) => name.trim().toLowerCase() === "quantity";
  const [options, setOptions] = useState<DraftOption[]>(() => (item?.options ?? []).map((option) => ({ key: keys++, name: option.name, values: option.values.map((value) => ({ key: keys++, label: value.label, extra: ((isQuantity(option.name) ? (item?.priceCents ?? 0) + value.extraCents : value.extraCents) / 100).toFixed(2) })) })));
  const setOption = (key: number, change: (option: DraftOption) => DraftOption) => setOptions((current) => current.map((option) => (option.key === key ? change(option) : option)));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const cents = (text: string) => Math.round(Number(text.replace(/[$,\s]/g, "") || 0) * 100);
    // With a Quantity option the starting price is the cheapest quantity; each quantity is stored relative to it.
    const quantity = options.find((option) => isQuantity(option.name));
    const base = quantity ? Math.min(...quantity.values.map((value) => cents(value.extra))) : null;
    if (base !== null) form.set("price", (base / 100).toFixed(2));
    form.set("options", JSON.stringify(options.map((option) => ({ name: option.name, values: option.values.map((value) => ({ label: value.label, extraCents: isQuantity(option.name) && base !== null ? cents(value.extra) - base : cents(value.extra) })) }))));
    startTransition(() => action(form));
  }

  return <form onSubmit={submit} className="admin-form cat-form">
    {item && <input type="hidden" name="id" value={item.id} />}
    <div className="bill-grid">
      <div className="field bill-wide"><label htmlFor="p-name">Product name</label><input id="p-name" name="name" defaultValue={item?.name} required maxLength={160} /></div>
      <div className="field"><label htmlFor="p-category">Category</label><input id="p-category" name="category" defaultValue={item?.category} list="p-categories" required maxLength={60} /><datalist id="p-categories">{categories.map((name) => <option key={name} value={name} />)}</datalist></div>
      <div className="field"><label htmlFor="p-subcategory">Sub-category (optional)</label><input id="p-subcategory" name="subcategory" defaultValue={item?.subcategory} list="p-subcategories" maxLength={60} placeholder="e.g. Circle" /><datalist id="p-subcategories">{subcategories.map((name) => <option key={name} value={name} />)}</datalist></div>
      <div className="field"><label htmlFor="p-pricing">Pricing</label><select id="p-pricing" name="pricing" defaultValue={item?.pricing ?? "fixed"}>{Object.entries(pricingLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <div className="field"><label htmlFor="p-roll">Roll width (mm, for roll pricing)</label><input id="p-roll" name="rollWidthMm" inputMode="numeric" defaultValue={item?.rollWidthMm ?? 1500} /></div>
      <div className="field"><label htmlFor="p-price">Price (ex GST, per item or per m²)</label><input id="p-price" name="price" inputMode="decimal" defaultValue={item ? (item.priceCents / 100).toFixed(2) : ""} required={!options.some((option) => isQuantity(option.name))} disabled={options.some((option) => isQuantity(option.name))} title="Set by the Quantity prices below" /></div>
      <div className="field"><label htmlFor="p-unit">Unit</label><input id="p-unit" name="unit" defaultValue={item?.unit ?? "each"} maxLength={30} /></div>
      <label className="bill-check"><input type="checkbox" name="active" defaultChecked={item ? item.active : true} /> Show in the quote/invoice catalog</label>
      <div className="field"><label htmlFor="p-code">Product code (client + production)</label><input id="p-code" name="code" defaultValue={item?.code} maxLength={80} placeholder="e.g. 3DL-LINE" style={{ fontFamily: "ui-monospace, Menlo, monospace" }} /></div>
      <div className="field bill-wide"><label htmlFor="p-production">Production notes (job sheet only, not shown to the client)</label><textarea id="p-production" name="production" defaultValue={item?.production} rows={2} maxLength={2000} placeholder="What production builds, materials, checks…" /></div>
      <div className="field bill-wide" style={{ gridColumn: "1 / -1" }}><label htmlFor="p-description">Standard description (optional, added under the product name on quotes)</label><textarea id="p-description" name="description" defaultValue={item?.description} rows={2} maxLength={1000} /></div>
    </div>
    <div className="cat-options"><h3>Options <small>Quantity: enter the full price for each quantity. Other options (e.g. Designing): enter what they add.</small></h3>
      {options.map((option) => <fieldset key={option.key} className="cat-option">
        <div className="cat-option-head"><input aria-label="Option name" value={option.name} onChange={(event) => setOption(option.key, (current) => ({ ...current, name: event.target.value }))} placeholder="Option name, e.g. Quantity" /><button type="button" className="bill-remove" onClick={() => setOptions((current) => current.filter((item) => item.key !== option.key))} aria-label={`Remove option ${option.name}`}><Trash2 aria-hidden /></button></div>
        {option.values.map((value, index) => <div key={value.key} className="cat-value">
          <input aria-label={`${option.name} value ${index + 1}`} value={value.label} onChange={(event) => setOption(option.key, (current) => ({ ...current, values: current.values.map((item) => (item.key === value.key ? { ...item, label: event.target.value } : item)) }))} placeholder="Value, e.g. 500" />
          <div className="bill-money"><span>{isQuantity(option.name) ? "$" : "+$"}</span><input aria-label={`${option.name} value ${index + 1} ${isQuantity(option.name) ? "price" : "extra price"}`} inputMode="decimal" value={value.extra} onChange={(event) => setOption(option.key, (current) => ({ ...current, values: current.values.map((item) => (item.key === value.key ? { ...item, extra: event.target.value } : item)) }))} /></div>
          <button type="button" className="bill-remove" disabled={option.values.length === 1} onClick={() => setOption(option.key, (current) => ({ ...current, values: current.values.filter((item) => item.key !== value.key) }))} aria-label="Remove value"><Trash2 aria-hidden /></button>
        </div>)}
        <button type="button" className="bill-add" onClick={() => setOption(option.key, (current) => ({ ...current, values: [...current.values, { key: keys++, label: "", extra: "0.00" }] }))}><Plus aria-hidden /> Add value</button>
      </fieldset>)}
      <button type="button" className="bill-add" onClick={() => setOptions((current) => [...current, { key: keys++, name: "", values: [{ key: keys++, label: "", extra: "0.00" }] }])}><Plus aria-hidden /> Add option</button>
    </div>
    <div className="bill-save">{state?.error && <p className="admin-error" role="alert">{state.error}</p>}{state?.ok && <p className="admin-ok" role="status">{state.ok}</p>}<button className="button button-orange" type="submit" disabled={pending}>{pending ? "Saving…" : item ? "Save product" : "Add product"}</button></div>
  </form>;
}
