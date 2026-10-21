"use client";

import { startTransition, useActionState, useState } from "react";
import { updatePaymentStage } from "../actions";
import type { PaymentStage } from "@/lib/billing";

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "Australia/Melbourne" });

/** Staff view of an invoice's payment stages: request the next payment, record payments, or reverse one. */
export function PaymentSchedule({ id, schedule, editable, isQuote }: { id: string; schedule: PaymentStage[]; editable: boolean; isQuote: boolean }) {
  const [state, act, pending] = useActionState(updatePaymentStage, null);
  const [recording, setRecording] = useState("");
  const [reference, setReference] = useState("");
  const run = (stage: string, action: string, ref = "") => { const form = new FormData(); form.set("id", id); form.set("stage", stage); form.set("action", action); form.set("reference", ref); setRecording(""); setReference(""); startTransition(() => act(form)); };
  const paid = schedule.filter((stage) => stage.status === "paid").reduce((sum, stage) => sum + stage.amountCents, 0);
  const total = schedule.reduce((sum, stage) => sum + stage.amountCents, 0);

  return <div className="pay-schedule">
    {!isQuote && <div className="pay-progress" aria-label={`${Math.round((paid / (total || 1)) * 100)}% paid`}><i style={{ width: `${(paid / (total || 1)) * 100}%` }} /><span>{money(paid)} of {money(total)} paid</span></div>}
    <ol>
      {schedule.map((stage, index) => <li key={stage.key} className={`is-${isQuote ? "plan" : stage.status}`}>
        <span className="pay-step">{index + 1}</span>
        <div className="pay-info"><b>{stage.label} · {stage.percent}%</b><small>{stage.when}{stage.status === "paid" && stage.paidAt ? ` · paid ${date.format(stage.paidAt)}` : stage.status === "due" && stage.requestedAt ? ` · requested ${date.format(stage.requestedAt)}` : ""}{stage.reference ? ` · ${stage.reference}` : ""}</small></div>
        <b className="pay-amount">{money(stage.amountCents)}</b>
        {!isQuote && <span className={`pay-badge is-${stage.status}`}>{stage.status === "paid" ? "Paid" : stage.status === "due" ? "Due now" : "Not yet due"}</span>}
        {!isQuote && editable && <div className="pay-buttons">
          {stage.status === "upcoming" && <button type="button" className="button button-light" disabled={pending} onClick={() => run(stage.key, "request")}>Request payment</button>}
          {stage.status === "due" && (recording === stage.key
            ? <form className="pay-record" onSubmit={(event) => { event.preventDefault(); run(stage.key, "paid", reference); }}><input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Reference (e.g. bank transfer, cash)" maxLength={80} aria-label="Payment reference" /><button className="button button-orange" type="submit" disabled={pending}>Save</button><button className="button button-light" type="button" onClick={() => setRecording("")}>Cancel</button></form>
            : <button type="button" className="button button-orange" disabled={pending} onClick={() => setRecording(stage.key)}>Mark paid</button>)}
          {stage.status === "paid" && <button type="button" className="pay-undo" disabled={pending} onClick={() => run(stage.key, "unpaid")}>Undo</button>}
        </div>}
      </li>)}
    </ol>
    {state?.error && <p className="admin-error" role="alert">{state.error}</p>}
    {state?.ok && <p className="admin-ok" role="status">{state.ok}</p>}
  </div>;
}
