"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { STICKER_M2_RATES } from "@/lib/custom-sticker";
import { JOINS_AGREED, joinsText, largestOffcut, layoutOnRoll, piecesText, VINYL_GAP_MM, VINYL_ROLL_WIDTHS, vinylRollPrice, type VinylPiece } from "@/lib/vinyl-nest";
import type { PickedLine } from "./catalog-picker";
import { RollPlan } from "./roll-plan";
export { RollPlan };
import { OffcutOffer, offcutLine, type OffcutPlan } from "./offcut-offer";

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const digits = (value: string, max = 5) => value.replace(/[^\d]/g, "").slice(0, max);
type Row = { key: number; width: string; height: string; qty: string };
let nextKey = 1;

/**
 * Vinyl stickers in several sizes, cut together from one roll: the job is charged for the roll used
 * (roll width × length) at a per m² rate, instead of costing each size on its own.
 */
export function VinylMixForm({ kind, onAdd, onBack }: { kind: "quote" | "invoice"; onAdd: (line: PickedLine) => void; onBack: () => void }) {
  const [rows, setRows] = useState<Row[]>([{ key: nextKey++, width: "500", height: "500", qty: "1" }, { key: nextKey++, width: "200", height: "200", qty: "4" }]);
  const [rollWidth, setRollWidth] = useState(VINYL_ROLL_WIDTHS[0]);
  const [rate, setRate] = useState(STICKER_M2_RATES[0]);
  const [note, setNote] = useState("");
  // Client agrees to joins: stickers longer than the roll are cut into sections and joined, using far less roll.
  const [joins, setJoins] = useState(false);
  const [useOffcut, setUseOffcut] = useState(false);
  const [offcutPlan, setOffcutPlan] = useState<OffcutPlan>({ pieces: [], layout: null });
  const pieces: VinylPiece[] = rows.map((row) => ({ widthMm: Number(row.width) || 0, heightMm: Number(row.height) || 0, qty: Number(row.qty) || 0 })).filter((piece) => piece.widthMm > 0 && piece.heightMm > 0 && piece.qty > 0);
  const tooBig = joins ? undefined : pieces.find((piece) => Math.min(piece.widthMm, piece.heightMm) > rollWidth);
  const needsJoin = pieces.some((piece) => Math.max(piece.widthMm, piece.heightMm) > rollWidth);
  const layout = pieces.length && !tooBig ? layoutOnRoll(pieces, rollWidth, VINYL_GAP_MM, joins) : null;
  const price = layout ? vinylRollPrice(layout, rate) : 0;
  // Roll the client pays for but doesn't use: offered for printing only.
  const offcut = layout ? largestOffcut(layout) : null;
  // The stickers line, then (if the client takes it) the offcut line.
  const addLines = (line: PickedLine) => { onAdd(line); if (useOffcut && offcut && offcutPlan.layout) onAdd(offcutLine(offcut, `Vinyl stickers${note.trim() ? ` (${note.trim()})` : ""}`, rollWidth, offcutPlan)); };
  const update = (key: number, change: Partial<Row>) => setRows((current) => current.map((row) => (row.key === key ? { ...row, ...change } : row)));

  return <div className="cat-detail vm-form">
    <button type="button" className="cat-back" onClick={onBack}>← Back to products</button>
    <h3>Vinyl stickers: mixed sizes</h3>
    <p className="admin-hint">All the stickers are cut together from one roll and charged for the roll used (width × length) at the rate per m², not size by size.</p>
    <div className="vm-rows">
      <div className="vm-row vm-head"><span>Width (mm)</span><span>Height (mm)</span><span>Quantity</span><span /></div>
      {rows.map((row, index) => <div className="vm-row" key={row.key}>
        <input aria-label={`Size ${index + 1} width`} inputMode="numeric" value={row.width} onChange={(event) => update(row.key, { width: digits(event.target.value) })} placeholder="500" />
        <input aria-label={`Size ${index + 1} height`} inputMode="numeric" value={row.height} onChange={(event) => update(row.key, { height: digits(event.target.value) })} placeholder="500" />
        <input aria-label={`Size ${index + 1} quantity`} inputMode="numeric" value={row.qty} onChange={(event) => update(row.key, { qty: digits(event.target.value, 3) })} placeholder="1" />
        <button type="button" className="bill-remove" aria-label={`Remove size ${index + 1}`} disabled={rows.length === 1} onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))}><Trash2 aria-hidden /></button>
      </div>)}
      <button type="button" className="bill-add" onClick={() => setRows((current) => [...current, { key: nextKey++, width: "", height: "", qty: "1" }])}><Plus aria-hidden /> Add a size</button>
    </div>
    <div className="field"><span className="ls-label">Roll width</span><div className="ls-chips">{VINYL_ROLL_WIDTHS.map((width) => <button key={width} type="button" className={`ls-chip${rollWidth === width ? " is-on" : ""}`} onClick={() => setRollWidth(width)}>{width} mm</button>)}</div></div>
    <div className="field"><span className="ls-label">Price per m²</span><div className="ls-chips" role="radiogroup" aria-label="Price per m²">{STICKER_M2_RATES.map((value) => <button key={value} type="button" role="radio" aria-checked={rate === value} className={`ls-chip${rate === value ? " is-on" : ""}`} onClick={() => setRate(value)}>${value / 100}/m²</button>)}</div></div>
    <label className={`cat-show-diagram vm-joins${needsJoin ? " is-relevant" : ""}`}><input type="checkbox" checked={joins} onChange={(event) => setJoins(event.target.checked)} /> Client agrees to joins <small>{needsJoin ? `Stickers longer than ${rollWidth} mm are cut into ${rollWidth} mm sections and joined, so they use much less roll.` : `Only matters for stickers longer than the ${rollWidth} mm roll.`}</small></label>
    <div className="field"><label htmlFor="vm-note">Vinyl / finish (optional)</label><input id="vm-note" value={note} onChange={(event) => setNote(event.target.value.slice(0, 120))} placeholder="e.g. Gloss white vinyl, laminated, contour cut" /></div>
    {tooBig && <p className="admin-error" role="alert">{tooBig.widthMm} × {tooBig.heightMm} mm is wider than a {rollWidth} mm roll both ways. Tick "Client agrees to joins", or choose a wider roll.</p>}
    {!tooBig && pieces.length > 0 && !layout && <p className="admin-error" role="alert">Too many stickers to lay out here (up to 500). Split the job.</p>}
    {layout && <>
      <RollPlan layout={layout} pieces={pieces} />
      <div className="cat-price"><span>Price (ex GST)</span><b>{money(price)}</b><small>{rollWidth} × {layout.lengthMm} mm = {layout.areaM2.toFixed(3)} m² × {money(rate)}/m²</small></div>
      {offcut && <OffcutOffer key={`${offcut.widthMm}x${offcut.lengthMm}`} offcut={offcut} checked={useOffcut} onChange={setUseOffcut} onPlan={setOffcutPlan} />}
    </>}
    <button type="button" className="button button-orange" disabled={!layout || (useOffcut && !!offcut && !offcutPlan.layout)} onClick={() => layout && addLines({
      description: `Vinyl stickers, mixed sizes${note.trim() ? ` · ${note.trim()}` : ""}\nPieces: ${piecesText(pieces)}\nCut from a ${rollWidth} mm roll: ${layout.lengthMm} mm used (${layout.areaM2.toFixed(3)} m²) at ${money(rate)} per m²${joinsText(layout) ? `\n${JOINS_AGREED}: ${joinsText(layout)}` : ""}`,
      qty: 1, unitCents: price, code: "VINYL-MIX",
      production: [`Vinyl stickers, mixed sizes${note.trim() ? ` (${note.trim()})` : ""}: ${piecesText(pieces)}`, `Nest on a ${rollWidth} mm roll, ${VINYL_GAP_MM} mm gaps: ${layout.lengthMm} mm of roll${layout.placements.some((item) => item.rotated) ? " (some pieces rotated)" : ""}`, joinsText(layout) ? `JOINS (client agreed): ${joinsText(layout)}` : ""].filter(Boolean).join("\n"),
    })}>{layout ? `Add to ${kind}` : "Enter the sizes"}</button>
  </div>;
}
