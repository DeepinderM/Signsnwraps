"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { fitInOffcut, OFFCUT_CODE, OFFCUT_PRINT_RATE_CENTS, piecesText, printedAreaM2, type RollLayout, type VinylPiece } from "@/lib/vinyl-nest";
import type { PickedLine } from "./catalog-picker";
import { RollPlan } from "./roll-plan";

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const digits = (value: string, max = 5) => value.replace(/[^\d]/g, "").slice(0, max);
export type Offcut = { widthMm: number; lengthMm: number; areaM2: number };
/** What the client is printing on the offcut: the sizes, and how they sit in it (null until they all fit). */
export type OffcutPlan = { pieces: VinylPiece[]; layout: RollLayout | null };

/** Printing-only price for the stickers printed on the offcut. */
export const offcutPrintPrice = (pieces: VinylPiece[]) => Math.round(printedAreaM2(pieces) * OFFCUT_PRINT_RATE_CENTS);

/** The quote line for using the offcut: the extra stickers, printing only, at the offcut rate. */
export function offcutLine(offcut: Offcut, material: string, rollWidthMm: number, plan: OffcutPlan): PickedLine {
  const area = printedAreaM2(plan.pieces);
  return {
    description: `Offcut print · ${material}\nOffcut from this job: ${offcut.widthMm} x ${offcut.lengthMm} mm (${offcut.areaM2.toFixed(3)} m²) of the ${rollWidthMm} mm roll\nPrinted on it: ${piecesText(plan.pieces)} (${area.toFixed(3)} m² printed) at ${money(OFFCUT_PRINT_RATE_CENTS)} per m² (printing only)`,
    qty: 1, unitCents: offcutPrintPrice(plan.pieces), code: OFFCUT_CODE,
    production: `Print on the offcut left on the roll (${offcut.widthMm} x ${offcut.lengthMm} mm): ${piecesText(plan.pieces)}. Vinyl already paid for; printing only.`,
  };
}

/** Offer shown when the job leaves a usable offcut. Once accepted, the client's extra sizes must fit inside it. */
export function OffcutOffer({ offcut, checked, onChange, onPlan }: { offcut: Offcut; checked: boolean; onChange: (value: boolean) => void; onPlan: (plan: OffcutPlan) => void }) {
  const [rows, setRows] = useState([{ key: 1, width: "", height: "", qty: "1" }]);
  const pieces = rows.map((row) => ({ widthMm: Number(row.width) || 0, heightMm: Number(row.height) || 0, qty: Number(row.qty) || 0 })).filter((piece) => piece.widthMm > 0 && piece.heightMm > 0 && piece.qty > 0);
  const layout = pieces.length ? fitInOffcut(pieces, offcut) : null;
  const used = printedAreaM2(pieces);
  const tooBig = pieces.find((piece) => Math.min(piece.widthMm, piece.heightMm) > Math.min(offcut.widthMm, offcut.lengthMm) || Math.max(piece.widthMm, piece.heightMm) > Math.max(offcut.widthMm, offcut.lengthMm));
  const setAndReport = (next: typeof rows) => {
    setRows(next);
    const nextPieces = next.map((row) => ({ widthMm: Number(row.width) || 0, heightMm: Number(row.height) || 0, qty: Number(row.qty) || 0 })).filter((piece) => piece.widthMm > 0 && piece.heightMm > 0 && piece.qty > 0);
    onPlan({ pieces: nextPieces, layout: nextPieces.length ? fitInOffcut(nextPieces, offcut) : null });
  };
  const update = (key: number, change: Partial<(typeof rows)[number]>) => setAndReport(rows.map((row) => (row.key === key ? { ...row, ...change } : row)));

  return <div className="offcut-offer">
    <b>Offcut offer</b>
    <p>This job leaves an offcut of <b>{offcut.widthMm} × {offcut.lengthMm} mm</b> ({offcut.areaM2.toFixed(2)} m²) on the roll the client is already paying for. They can have more stickers printed on it for the printing cost only: <b>{money(OFFCUT_PRINT_RATE_CENTS)} per m² printed</b>.</p>
    <label><input type="checkbox" checked={checked} onChange={(event) => { onChange(event.target.checked); if (event.target.checked) onPlan({ pieces, layout }); }} /> Client wants to use the offcut</label>
    {checked && <>
      <div className="vm-rows">
        <div className="vm-row vm-head"><span>Sticker width (mm)</span><span>Height (mm)</span><span>Quantity</span><span /></div>
        {rows.map((row, index) => <div className="vm-row" key={row.key}>
          <input aria-label={`Offcut sticker ${index + 1} width`} inputMode="numeric" value={row.width} onChange={(event) => update(row.key, { width: digits(event.target.value) })} placeholder="400" />
          <input aria-label={`Offcut sticker ${index + 1} height`} inputMode="numeric" value={row.height} onChange={(event) => update(row.key, { height: digits(event.target.value) })} placeholder="600" />
          <input aria-label={`Offcut sticker ${index + 1} quantity`} inputMode="numeric" value={row.qty} onChange={(event) => update(row.key, { qty: digits(event.target.value, 3) })} placeholder="1" />
          <button type="button" className="bill-remove" aria-label={`Remove offcut sticker ${index + 1}`} disabled={rows.length === 1} onClick={() => setAndReport(rows.filter((item) => item.key !== row.key))}><Trash2 aria-hidden /></button>
        </div>)}
        <button type="button" className="bill-add" onClick={() => setAndReport([...rows, { key: Date.now(), width: "", height: "", qty: "1" }])}><Plus aria-hidden /> Add another size</button>
      </div>
      {!pieces.length && <p className="offcut-hint">Enter the sizes the client wants printed on the offcut.</p>}
      {pieces.length > 0 && !layout && <p className="admin-error" role="alert">{tooBig ? `${tooBig.widthMm} × ${tooBig.heightMm} mm is bigger than the ${offcut.widthMm} × ${offcut.lengthMm} mm offcut.` : `These don't all fit in the ${offcut.widthMm} × ${offcut.lengthMm} mm offcut (${used.toFixed(2)} of ${offcut.areaM2.toFixed(2)} m², plus cutting gaps). Remove or shrink a size.`}</p>}
      {layout && <><RollPlan layout={layout} /><p className="offcut-fit">✓ Fits in the offcut · {used.toFixed(3)} m² printed × {money(OFFCUT_PRINT_RATE_CENTS)}/m² = <b>{money(offcutPrintPrice(pieces))}</b></p></>}
    </>}
  </div>;
}
