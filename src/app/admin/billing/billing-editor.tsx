"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { rollUsage, type CatalogItem } from "@/lib/catalog-types";
import { panelSetLabel } from "@/lib/acp-panels";
import type { RollDetails } from "@/lib/billing";
import { CatalogPicker, type PickedLine } from "./catalog-picker";
import { saveBilling } from "./actions";

type Item = { key: number; description: string; qty: string; price: string; gst: boolean; roll?: RollDetails; code?: string; production?: string; acp?: { widthMm: number; heightMm: number; signs?: number; showDiagram?: boolean; panelSet?: string } };
type Customer = { name: string; business: string; email: string; phone: string; address: string; abn: string };
type Props = {
  id?: string; kind: "quote" | "invoice"; gstRegistered: boolean; stores: { value: string; label: string }[] | null; catalog: CatalogItem[];
  initial: { store: string; customer: Customer; items: { description: string; qty: number; unitCents: number; gst: boolean; roll?: RollDetails; code?: string; production?: string; acp?: { widthMm: number; heightMm: number; signs?: number; showDiagram?: boolean; panelSet?: string } }[]; title: string; notes: string; issueDate: string; dueDate: string; enquiryId: string; userId: string };
};

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const toCents = (value: string) => Math.round(Number(value.replace(/[$,\s]/g, "")) * 100);
let nextKey = 1;

/** Quote / invoice editor: customer, line items (ex GST) with live GST and totals, dates and notes. */
export function BillingEditor({ id, kind, gstRegistered, stores, catalog, initial }: Props) {
  const [showCatalog, setShowCatalog] = useState(false);
  const [state, action, pending] = useActionState(saveBilling, null);
  const [customer, setCustomer] = useState(initial.customer);
  const [items, setItems] = useState<Item[]>(() => (initial.items.length ? initial.items : [{ description: "", qty: 1, unitCents: 0, gst: true }]).map((item) => ({ key: nextKey++, description: item.description, qty: String(item.qty), price: item.unitCents ? (item.unitCents / 100).toFixed(2) : "", gst: item.gst, roll: item.roll, code: item.code, production: item.production, acp: item.acp })));

  const lines = items.map((item) => { const qty = Number(item.qty) || 0, unit = toCents(item.price) || 0, amount = Math.round(qty * unit); return { ...item, qty, unit, amount, gstCents: gstRegistered && item.gst ? Math.round(amount * 0.1) : 0 }; });
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const gst = lines.reduce((sum, line) => sum + line.gstCents, 0);

  // A catalog product fills the starter line if it's still empty, otherwise it's added below.
  const addFromCatalog = (line: PickedLine) => setItems((current) => {
    const next: Item = { key: nextKey++, description: line.description, qty: String(line.qty), price: (line.unitCents / 100).toFixed(2), gst: true, roll: line.roll, code: line.code, production: line.production, acp: line.acp };
    const blank = (item: Item) => !item.description.trim() && !item.price;
    return current.length === 1 && blank(current[0]) ? [next] : [...current.filter((item) => !blank(item)), next];
  });
  const update = (key: number, change: Partial<Item>) => setItems((current) => current.map((item) => (item.key === key ? { ...item, ...change } : item)));
  const setField = (key: keyof Customer) => (event: { target: { value: string } }) => setCustomer((current) => ({ ...current, [key]: event.target.value }));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("items", JSON.stringify(lines.filter((line) => line.description.trim() || line.unit).map((line) => ({ description: line.description, qty: line.qty, unitCents: line.unit, gst: line.gst, ...(line.roll ? { roll: line.roll } : {}), ...(line.code ? { code: line.code } : {}), ...(line.production ? { production: line.production } : {}), ...(line.acp ? { acp: line.acp } : {}) }))));
    startTransition(() => action(form));
  }

  return <form onSubmit={submit} className="bill-editor">
    {id && <input type="hidden" name="id" value={id} />}
    <input type="hidden" name="kind" value={kind} /><input type="hidden" name="enquiryId" value={initial.enquiryId} /><input type="hidden" name="userId" value={initial.userId} />

    <section className="admin-card"><h2>{kind === "quote" ? "Quote for" : "Bill to"}</h2>
      <div className="bill-grid">
        <div className="field"><label htmlFor="b-name">Contact name</label><input id="b-name" name="name" value={customer.name} onChange={setField("name")} maxLength={120} /></div>
        <div className="field"><label htmlFor="b-business">Business</label><input id="b-business" name="business" value={customer.business} onChange={setField("business")} maxLength={120} /></div>
        <div className="field"><label htmlFor="b-email">Email</label><input id="b-email" name="email" type="email" value={customer.email} onChange={setField("email")} /></div>
        <div className="field"><label htmlFor="b-phone">Phone</label><input id="b-phone" name="phone" value={customer.phone} onChange={setField("phone")} maxLength={40} /></div>
        <div className="field bill-wide"><label htmlFor="b-address">Address</label><input id="b-address" name="address" value={customer.address} onChange={setField("address")} maxLength={300} placeholder="Street, suburb, state, postcode" /></div>
        <div className="field"><label htmlFor="b-abn">Customer ABN (optional)</label><input id="b-abn" name="abn" value={customer.abn} onChange={setField("abn")} maxLength={20} /></div>
      </div>
    </section>

    <section className="admin-card"><h2>Details</h2>
      <div className="bill-grid">
        <div className="field bill-wide"><label htmlFor="b-title">Project / title</label><input id="b-title" name="title" defaultValue={initial.title} maxLength={200} placeholder="e.g. Ford Ranger colour PPF, satin black" /></div>
        <div className="field"><label htmlFor="b-issue">Issue date</label><input id="b-issue" name="issueDate" type="date" defaultValue={initial.issueDate} required /></div>
        <div className="field"><label htmlFor="b-due">{kind === "quote" ? "Valid until" : "Due date"}</label><input id="b-due" name="dueDate" type="date" defaultValue={initial.dueDate} required /></div>
        {stores && <div className="field"><label htmlFor="b-store">Managing store</label><select id="b-store" name="store" defaultValue={initial.store} required><option value="" disabled>Choose a store</option>{stores.map((store) => <option key={store.value} value={store.value}>{store.label}</option>)}</select></div>}
      </div>
    </section>

    <section className="admin-card"><h2>Line items <small>Prices exclude GST</small></h2>
      <div className="bill-items" role="table" aria-label="Line items">
        <div className="bill-row bill-head" role="row"><span>Description</span><span>Qty</span><span>Unit price</span>{gstRegistered && <span>GST</span>}<span>Amount</span><span /></div>
        {lines.map((line, index) => <div className="bill-row" role="row" key={line.key}>
          <textarea aria-label={`Line ${index + 1} description`} value={line.description} onChange={(event) => update(line.key, { description: event.target.value })} rows={2} maxLength={2000} placeholder="What's included" />
          <input aria-label={`Line ${index + 1} quantity`} inputMode="decimal" value={items[index].qty} onChange={(event) => update(line.key, { qty: event.target.value })} />
          <div className="bill-money"><span>$</span><input aria-label={`Line ${index + 1} unit price`} inputMode="decimal" value={items[index].price} onChange={(event) => update(line.key, { price: event.target.value })} placeholder="0.00" /></div>
          {gstRegistered && <label className="bill-gst"><input type="checkbox" checked={line.gst} onChange={(event) => update(line.key, { gst: event.target.checked })} /> 10%</label>}
          <b className="bill-amount">{money(line.amount)}</b>
          <button type="button" className="bill-remove" aria-label={`Remove line ${index + 1}`} onClick={() => setItems((current) => current.length > 1 ? current.filter((item) => item.key !== line.key) : current)} disabled={items.length === 1}><Trash2 aria-hidden /></button>
          {line.roll && <label className="bill-roll"><input type="checkbox" checked={line.roll.showDiagram} onChange={(event) => update(line.key, { roll: { ...line.roll!, showDiagram: event.target.checked } })} /> Show roll diagram to customer <small>{line.roll.widthMm} × {line.roll.heightMm} mm · {rollUsage(line.roll.widthMm, line.roll.heightMm, line.roll.rollWidthMm).areaM2.toFixed(2)} m² of {line.roll.rollWidthMm} mm roll</small></label>}
          {line.acp && <label className="bill-roll"><input type="checkbox" checked={!!line.acp.showDiagram} onChange={(event) => update(line.key, { acp: { ...line.acp!, showDiagram: event.target.checked } })} /> Show {panelSetLabel(line.acp.panelSet)} cutting plan to customer <small>{line.acp.signs ?? line.qty} × {line.acp.widthMm} × {line.acp.heightMm} mm</small></label>}
          <details className="bill-meta" open={!!(line.code || line.production)}><summary>{line.code ? <>Code <code className="prod-code">{line.code}</code></> : "Add product code / production notes"}{line.production ? " · production notes" : ""}</summary>
            <div className="bill-meta-fields"><label>Product code <small>(client + production)</small><input value={line.code ?? ""} onChange={(event) => update(line.key, { code: event.target.value.toUpperCase() })} maxLength={80} placeholder="e.g. 3DL-LF-H300-D45-ACR-ALU-PVC" /></label>
              <label>Production notes <small>(job sheet only, not shown to the client)</small><textarea value={line.production ?? ""} onChange={(event) => update(line.key, { production: event.target.value })} rows={3} maxLength={2000} /></label></div>
          </details>
        </div>)}
      </div>
      <div className="bill-add-row">
        {catalog.length > 0 && <button type="button" className="bill-add bill-add-catalog" onClick={() => setShowCatalog(true)} aria-expanded={showCatalog}><BookOpen aria-hidden /> Add from catalog</button>}
        <button type="button" className="bill-add" onClick={() => setItems((current) => [...current, { key: nextKey++, description: "", qty: "1", price: "", gst: true }])}><Plus aria-hidden /> Add custom line</button>
      </div>
      {showCatalog && <CatalogPicker items={catalog} kind={kind} onAdd={addFromCatalog} onClose={() => setShowCatalog(false)} />}
      <dl className="bill-totals">
        <div><dt>Subtotal (ex GST)</dt><dd>{money(subtotal)}</dd></div>
        {gstRegistered && <div><dt>GST (10%)</dt><dd>{money(gst)}</dd></div>}
        <div className="is-total"><dt>Total{gstRegistered ? " incl. GST" : ""}</dt><dd>{money(subtotal + gst)}</dd></div>
      </dl>
    </section>

    <section className="admin-card"><h2>Notes for the customer</h2>
      <div className="field"><label htmlFor="b-notes" className="sr-only">Notes</label><textarea id="b-notes" name="notes" defaultValue={initial.notes} rows={4} maxLength={3000} placeholder="Scope, inclusions, timing, warranty… (printed on the document)" /></div>
    </section>

    <div className="bill-save">
      {state?.error && <p className="admin-error" role="alert">{state.error}</p>}
      {state?.ok && <p className="admin-ok" role="status">{state.ok}</p>}
      <button className="button button-orange" type="submit" disabled={pending}>{pending ? "Saving…" : id ? "Save changes" : `Create ${kind}`}</button>
    </div>
  </form>;
}
