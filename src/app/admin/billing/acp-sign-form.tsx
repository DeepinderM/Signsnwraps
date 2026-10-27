"use client";

import { useState } from "react";
import { describeJobBill, panelName, planAcpJob } from "@/lib/acp-panels";
import { AcpDiagram } from "@/components/billing/acp-diagram";
import type { PickedLine } from "./catalog-picker";

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const digits = (value: string) => value.replace(/[^\d]/g, "");

/** ACP sign (vinyl printed & laminated) at any size, priced from the cheapest combination of panels. */
export function AcpSignForm({ kind, onAdd, onBack }: { kind: "quote" | "invoice"; onAdd: (line: PickedLine) => void; onBack: () => void }) {
  const [size, setSize] = useState({ width: "", height: "" });
  const [pieces, setPieces] = useState("1");
  const [showDiagram, setShowDiagram] = useState(false);
  const w = Number(size.width) || 0, h = Number(size.height) || 0, qty = Math.max(Number(pieces) || 0, 0);
  // The whole job is planned together, so pieces from several signs can share a sheet.
  const job = w >= 50 && h >= 50 && qty >= 1 ? planAcpJob(w, h, qty) : null;
  // Prefer "qty × unit price"; if the job total doesn't divide evenly into cents, quote it as one line for all signs.
  const even = job ? job.costCents % qty === 0 : false;
  const tooBig = w > 30000 || h > 30000;

  return <div className="cat-detail ls-form">
    <button type="button" className="cat-back" onClick={onBack}>← Back to products</button>
    <h3>ACP sign, vinyl printed &amp; laminated</h3>
    <p className="admin-hint">Enter the size the client wants. The cheapest combination of panels (1200×1200, 1220×2440, 1220×3050, 1500×3000) is worked out for you.</p>
    <div className="cs-size">
      <div className="field"><label htmlFor="acp-w">Sign width (mm)</label><input id="acp-w" inputMode="numeric" value={size.width} onChange={(event) => setSize({ ...size, width: digits(event.target.value) })} placeholder="e.g. 5000" /></div>
      <span aria-hidden>×</span>
      <div className="field"><label htmlFor="acp-h">Sign height (mm)</label><input id="acp-h" inputMode="numeric" value={size.height} onChange={(event) => setSize({ ...size, height: digits(event.target.value) })} placeholder="e.g. 2000" /></div>
      <div className="field"><label htmlFor="acp-qty">Number of signs</label><input id="acp-qty" inputMode="numeric" value={pieces} onChange={(event) => setPieces(digits(event.target.value))} /></div>
    </div>
    {tooBig && <p className="admin-error">Sizes up to 30,000 mm. Split very large signs into sections.</p>}
    {job && <>
      <p className="cat-area">Cheapest sheets for {qty} sign{qty === 1 ? "" : "s"}: <b>{describeJobBill(job)}</b> = <b>{money(job.costCents)}</b>{qty > 1 ? ` (${money(Math.round(job.costCents / qty))} per sign)` : ""}</p>
      <AcpDiagram widthMm={w} heightMm={h} qty={qty} job={job} />
      <label className="cat-show-diagram"><input type="checkbox" checked={showDiagram} onChange={(event) => setShowDiagram(event.target.checked)} /> Show this cutting plan to the customer on the {kind} (online and PDF, without sheet prices)</label>
      <div className="cat-price"><span>{qty > 1 ? `${qty} signs, sheets shared` : "Price (ex GST)"}</span><b>{money(job.costCents)}</b></div>
    </>}
    <button type="button" className="button button-orange" disabled={!job} onClick={() => job && onAdd({
      description: `ACP sign, vinyl printed & laminated\nSize: ${w} x ${h} mm${even || qty === 1 ? "" : ` (${qty} signs)`}`,
      qty: even ? qty : 1, unitCents: even ? job.costCents / qty : job.costCents, code: "ACP-SIGN", acp: { widthMm: w, heightMm: h, signs: qty, showDiagram },
      production: [`ACP sign ${w} x ${h} mm × ${qty}: print vinyl to artwork, laminate, apply to ACP`, `Sheets: ${describeJobBill(job)} (${job.count} sheet${job.count === 1 ? "" : "s"}, pieces nested to reuse offcut)`,
        ...job.sheets.map((sheet, index) => `Sheet ${index + 1} (${panelName(sheet.panel)}): ${sheet.placements.map((item) => `S${item.piece.id.toUpperCase()} ${item.piece.widthMm}x${item.piece.heightMm}${item.rotated ? " rotated" : ""}`).join(", ")}`)].join("\n"),
    })}>{job ? `Add to ${kind}` : "Enter the sign size"}</button>
  </div>;
}
