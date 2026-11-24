"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { ref, uploadBytesResumable } from "firebase/storage";
import { FileDown, Paperclip, Send, X } from "lucide-react";
import { clientStorage } from "@/lib/firebase/client";
import { formatBytes, uploadContentType } from "@/lib/uploads";
import { startEmailUpload } from "@/app/admin/email-actions";
import type { PurchaseOrder } from "@/lib/purchase-orders";
import { poTotals, vendorDiscount, type Vendor } from "@/lib/vendor-types";
import type { StoreId } from "@/lib/staff";
import Link from "next/link";
import { savePurchaseOrderDraft, sendPurchaseOrder } from "./actions";

type Upload = { id: string; name: string; size: number; path: string; status: "uploading" | "done" | "error"; progress: number };
const money = (cents: number) => `$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const safeName = (name: string) => name.replace(/[^\w.-]+/g, "_").slice(-100);

/**
 * Purchase order editor: tick the lines to order (site costs such as lift / access hire stay with Signs N Wraps),
 * check the project summary, choose who it goes to and what's attached, then send it.
 */
export function PurchaseOrderForm({ id, po, artwork, selfEmail, vendors, store, storeName, canManageVendors }: { id: string; po: PurchaseOrder; artwork: { path: string; name: string; size: number }[]; selfEmail: string; vendors: Vendor[]; store: StoreId | null; storeName: string; canManageVendors: boolean }) {
  const [saveState, save, saving] = useActionState(savePurchaseOrderDraft, null);
  const [sendState, send, sending] = useActionState(sendPurchaseOrder, null);
  const [lines, setLines] = useState(po.lines.map((line) => ({ include: line.include, note: line.note })));
  const [summary, setSummary] = useState(po.summary);
  const [vendorId, setVendorId] = useState(po.vendorId);
  const vendor = vendors.find((item) => item.id === vendorId) ?? vendors[0];
  // The discount always follows the vendor list (set by the super admin): it's what saving or sending applies.
  const discount = vendor ? vendorDiscount(vendor, store) : 0;
  const totals = poTotals(po.lines.map((line, index) => ({ ...line, include: lines[index].include })), discount);
  function pickVendor(next: string) { const found = vendors.find((item) => item.id === next); setVendorId(next); if (found?.emails.length) setRecipients(found.emails); }
  const [recipients, setRecipients] = useState(po.recipients);
  const [newRecipient, setNewRecipient] = useState("");
  const [ccSelf, setCcSelf] = useState(po.ccSelf);
  const [attachProductionSheet, setAttachProductionSheet] = useState(po.attachProductionSheet);
  const [includeCustomer, setIncludeCustomer] = useState(po.includeCustomer);
  const [requiredBy, setRequiredBy] = useState(po.requiredBy);
  const [chosenArtwork, setChosenArtwork] = useState(() => new Set(po.artwork.length || po.status === "sent" ? po.artwork : artwork.map((file) => file.path)));
  const [uploads, setUploads] = useState<Upload[]>(po.uploads.map((file) => ({ id: file.path, name: file.name, size: file.size, path: file.path, status: "done", progress: 1 })));
  const [fileSession, setFileSession] = useState("");
  const [notice, setNotice] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const busy = saving || sending || uploads.some((file) => file.status === "uploading");
  const ordered = lines.filter((line) => line.include).length;

  function addRecipient() {
    const value = newRecipient.trim().toLowerCase();
    if (!value) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { setNotice(`${value} isn't a valid email address.`); return; }
    setNotice(""); setRecipients((current) => (current.includes(value) ? current : [...current, value])); setNewRecipient("");
  }
  async function attach(list: FileList | null) {
    const incoming = [...(list ?? [])];
    if (fileInput.current) fileInput.current.value = "";
    if (!incoming.length) return;
    let session = fileSession;
    if (!session) {
      const result = await startEmailUpload();
      if ("error" in result) { setNotice(result.error); return; }
      session = result.id; setFileSession(session);
    }
    for (const file of incoming.slice(0, 10 - uploads.length)) {
      const key = crypto.randomUUID().slice(0, 8), path = `staff-uploads/${session}/${key}-${safeName(file.name)}`;
      setUploads((current) => [...current, { id: key, name: file.name, size: file.size, path, status: "uploading", progress: 0 }]);
      const update = (change: Partial<Upload>) => setUploads((current) => current.map((item) => (item.id === key ? { ...item, ...change } : item)));
      const task = uploadBytesResumable(ref(clientStorage(), path), file, { contentType: uploadContentType(file.name, file.type) });
      task.on("state_changed", (snapshot) => update({ progress: snapshot.totalBytes ? snapshot.bytesTransferred / snapshot.totalBytes : 0 }), () => update({ status: "error" }), () => update({ status: "done", progress: 1 }));
    }
  }
  function submit(action: "save" | "send") {
    const form = new FormData();
    form.set("id", id);
    form.set("fileSession", fileSession);
    form.set("po", JSON.stringify({ lines, summary, vendorId, recipients, ccSelf, attachProductionSheet, includeCustomer, requiredBy, artwork: [...chosenArtwork], uploads: uploads.filter((file) => file.status === "done").map((file) => ({ path: file.path, name: file.name })) }));
    startTransition(() => (action === "save" ? save(form) : send(form)));
  }
  const result = [saveState, sendState].filter(Boolean).sort((a, b) => (b!.at ?? 0) - (a!.at ?? 0))[0];

  return <div className="po-form">
    <section className="admin-card">
      <h2>Vendor</h2>
      <div className="po-grid">
        <div className="field"><label htmlFor="po-vendor">Send this order to</label><select id="po-vendor" value={vendorId} onChange={(event) => pickVendor(event.target.value)}>{vendors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <small>{canManageVendors ? <Link href="/admin/billing/vendors">Manage vendors and franchise discounts</Link> : "Vendors and discounts are set by the super admin."}</small></div>
        <div className="po-totals" title="Internal: not sent to the vendor"><small className="po-internal">Internal only · not sent to the vendor</small>
          <div><span>Invoice price (ex GST)</span><b>{money(totals.subtotalCents)}</b></div>
          <div><span>Franchise discount ({discount}%{store ? `, ${storeName}` : ""})</span><b>−{money(totals.discountCents)}</b></div>
          <div className="is-strong"><span>PO amount (ex GST)</span><b>{money(totals.netCents)}</b></div>
          <div><span>GST</span><b>{money(totals.gstCents)}</b></div>
          <div className="is-strong"><span>PO total (incl. GST)</span><b>{money(totals.totalCents)}</b></div>
        </div>
      </div>
    </section>

    <section className="admin-card">
      <h2>Items to order <small>{ordered} of {lines.length} ticked</small></h2>
      <p className="admin-hint">Untick anything Signs N Wraps pays for itself, like lift or access hire. Lift, access, scaffold and permit lines start unticked. The PO, its email and the vendor portal show job details only: no prices. The amounts here are for your records.</p>
      <ul className="po-lines">{po.lines.map((line, index) => {
        const [first, ...rest] = line.description.split("\n");
        return <li key={index} className={lines[index].include ? "is-on" : ""}>
          <label className="po-line-head"><input type="checkbox" checked={lines[index].include} onChange={(event) => setLines((current) => current.map((item, i) => (i === index ? { ...item, include: event.target.checked } : item)))} />
            <span className="po-qty">{line.qty}×</span><span className="po-line-price">{money(Math.round(line.qty * line.unitCents))}</span><span><b>{first}</b>{line.code && <code className="prod-code">{line.code}</code>}{rest.length > 0 && <small>{rest.join(" · ")}</small>}</span></label>
          {lines[index].include && <input className="po-note" value={lines[index].note} maxLength={500} placeholder="Note for the manufacturer (optional)" onChange={(event) => setLines((current) => current.map((item, i) => (i === index ? { ...item, note: event.target.value } : item)))} />}
        </li>;
      })}</ul>
    </section>

    <section className="admin-card">
      <h2>Project summary</h2>
      <p className="admin-hint">Goes in the email and on the purchase order. Edit it to describe the job for the manufacturer.</p>
      <textarea className="po-summary" rows={9} value={summary} maxLength={5000} onChange={(event) => setSummary(event.target.value)} />
      <div className="po-grid">
        <div className="field"><label htmlFor="po-required">Required by (optional)</label><input id="po-required" type="date" value={requiredBy} onChange={(event) => setRequiredBy(event.target.value)} /></div>
      </div>
    </section>

    <section className="admin-card">
      <h2>Send to</h2>
      <div className="po-chips">{recipients.map((email) => <span key={email} className="po-chip">{email}<button type="button" aria-label={`Remove ${email}`} onClick={() => setRecipients((current) => current.filter((item) => item !== email))}><X aria-hidden /></button></span>)}</div>
      <div className="po-add"><input type="email" value={newRecipient} placeholder="Add another email" onChange={(event) => setNewRecipient(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addRecipient(); } }} /><button type="button" className="button button-light" onClick={addRecipient}>Add</button></div>
      <h3>Options</h3>
      <div className="po-options">
        <label><input type="checkbox" checked={attachProductionSheet} onChange={(event) => setAttachProductionSheet(event.target.checked)} /> Attach the production sheet (PDF)</label>
        <label><input type="checkbox" checked={includeCustomer} onChange={(event) => setIncludeCustomer(event.target.checked)} /> Include the client's name, site address and phone (for delivery / installation)</label>
        <label><input type="checkbox" checked={ccSelf} onChange={(event) => setCcSelf(event.target.checked)} /> Send me a copy ({selfEmail})</label>
      </div>
    </section>

    <section className="admin-card">
      <h2>Artwork</h2>
      {artwork.length ? <><p className="admin-hint">Files the client sent with their enquiry. Ticked files are attached.</p>
        <div className="po-options">{artwork.map((file) => <label key={file.path}><input type="checkbox" checked={chosenArtwork.has(file.path)} onChange={(event) => setChosenArtwork((current) => { const next = new Set(current); if (event.target.checked) next.add(file.path); else next.delete(file.path); return next; })} /> {file.name} <small>{formatBytes(file.size)}</small></label>)}</div></>
        : <p className="admin-hint">No artwork came with the enquiry. Upload the print-ready files here.</p>}
      {uploads.length > 0 && <ul className="po-uploads">{uploads.map((file) => <li key={file.id}><Paperclip aria-hidden /> {file.name} <small>{file.status === "uploading" ? `${Math.round(file.progress * 100)}%` : file.status === "error" ? "Upload failed" : formatBytes(file.size)}</small><button type="button" aria-label={`Remove ${file.name}`} onClick={() => setUploads((current) => current.filter((item) => item.id !== file.id))}><X aria-hidden /></button></li>)}</ul>}
      <input ref={fileInput} type="file" multiple hidden onChange={(event) => attach(event.target.files)} />
      <button type="button" className="button button-light" onClick={() => fileInput.current?.click()} disabled={uploads.length >= 10}><Paperclip aria-hidden /> Upload artwork</button>
      <p className="admin-hint">Up to 15 MB of attachments in total. Share bigger files as a link in the summary.</p>
    </section>

    <section className="admin-card po-send">
      {notice && <p className="admin-error" role="alert">{notice}</p>}
      {result?.error && <p className="admin-error" role="alert">{result.error}</p>}
      {result?.ok && <p className="admin-ok" role="status">{result.ok}</p>}
      <div className="po-actions">
        <a className="button button-light" href={`/admin/billing/${id}/purchase-order/pdf`} target="_blank" rel="noreferrer"><FileDown aria-hidden /> Preview PO</a>
        <a className="button button-light" href={`/admin/billing/${id}/purchase-order/pdf?sheet=1`} target="_blank" rel="noreferrer"><FileDown aria-hidden /> Preview production sheet</a>
        <button type="button" className="button button-light" disabled={busy} onClick={() => submit("save")}>{saving ? "Saving…" : "Save draft"}</button>
        <button type="button" className="button button-orange" disabled={busy || !ordered || !recipients.length} onClick={() => submit("send")}><Send aria-hidden /> {sending ? "Sending…" : po.status === "sent" ? "Send again" : "Send purchase order"}</button>
      </div>
      <small className="admin-hint">Previews show the last saved version. Save the draft first to preview your changes.</small>
    </section>
  </div>;
}
