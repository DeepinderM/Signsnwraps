"use client";

import { startTransition, useActionState, useState } from "react";
import { updatePaymentStage } from "../actions";
import type { PaymentStage } from "@/lib/billing";
import { paymentMethodLabel, type PaymentMethod } from "@/lib/payment-methods";

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "Australia/Melbourne" });
const dateTime = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Australia/Melbourne" });
const STAFF_METHODS: PaymentMethod[] = ["bank", "cash"];

/** Staff view of an invoice's payment stages: request the next payment, record payments, or reverse one. */
export function PaymentSchedule({ id, schedule, editable, isQuote }: { id: string; schedule: PaymentStage[]; editable: boolean; isQuote: boolean }) {
  const [state, act, pending] = useActionState(updatePaymentStage, null);
  const [recording, setRecording] = useState("");
  const [reference, setReference] = useState("");
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const run = (stage: string, action: string, ref = "", how = "") => { const form = new FormData(); form.set("id", id); form.set("stage", stage); form.set("action", action); form.set("reference", ref); form.set("method", how); setRecording(""); setReference(""); setMethod(""); startTransition(() => act(form)); };
  const paid = schedule.filter((stage) => stage.status === "paid").reduce((sum, stage) => sum + stage.amountCents, 0);
  const total = schedule.reduce((sum, stage) => sum + stage.amountCents, 0);

  return <div className="pay-schedule">
    {!isQuote && <div className="pay-progress" aria-label={`${Math.round((paid / (total || 1)) * 100)}% paid`}><i style={{ width: `${(paid / (total || 1)) * 100}%` }} /><span>{money(paid)} of {money(total)} paid</span></div>}
    <ol>
      {schedule.map((stage, index) => <li key={stage.key} className={`is-${isQuote ? "plan" : stage.status}`}>
        <span className="pay-step">{index + 1}</span>
        <div className="pay-info"><b>{stage.label} · {stage.percent}%</b><small>{stage.when}{stage.status === "due" && stage.requestedAt ? ` · requested ${date.format(stage.requestedAt)}` : ""}</small>
          {stage.status === "paid" && <span className="pay-record-line">
            {stage.method && <span className={`pay-method is-${stage.method}`}>{paymentMethodLabel[stage.method]}</span>}
            <span>Paid {stage.paidAt ? dateTime.format(stage.paidAt) : ""}{stage.paidBy ? <> · marked by <b title={stage.paidByEmail || undefined}>{stage.paidBy}</b></> : ""}{stage.reference ? ` · Ref: ${stage.reference}` : ""}</span>
          </span>}</div>
        <b className="pay-amount">{money(stage.amountCents)}</b>
        {!isQuote && <span className={`pay-badge is-${stage.status}`}>{stage.status === "paid" ? "Paid" : stage.status === "due" ? "Due now" : "Not yet due"}</span>}
        {!isQuote && editable && <div className="pay-buttons">
          {stage.status === "upcoming" && <button type="button" className="button button-light" disabled={pending} onClick={() => run(stage.key, "request")}>Request payment</button>}
          {stage.status === "due" && (recording === stage.key
            ? <form className="pay-record" onSubmit={(event) => { event.preventDefault(); if (method) run(stage.key, "paid", reference, method); }}>
                <div className="pay-methods" role="radiogroup" aria-label="How was it paid?">{STAFF_METHODS.map((value) => <label key={value} className={method === value ? "is-on" : ""}><input type="radio" name={`method-${stage.key}`} value={value} checked={method === value} onChange={() => setMethod(value)} />{paymentMethodLabel[value]}</label>)}</div>
                <input value={reference} onChange={(event) => setReference(event.target.value)} placeholder={method === "cash" ? "Receipt no. (optional)" : "Bank reference (optional)"} maxLength={80} aria-label="Payment reference" />
                <button className="button button-orange" type="submit" disabled={pending || !method}>Mark paid</button><button className="button button-light" type="button" onClick={() => { setRecording(""); setMethod(""); }}>Cancel</button></form>
            : <button type="button" className="button button-orange" disabled={pending} onClick={() => setRecording(stage.key)}>Mark paid</button>)}
          {stage.status === "paid" && <button type="button" className="pay-undo" disabled={pending} onClick={() => run(stage.key, "unpaid")}>Undo</button>}
        </div>}
      </li>)}
    </ol>
    {state?.error && <p className="admin-error" role="alert">{state.error}</p>}
    {state?.ok && <p className="admin-ok" role="status">{state.ok}</p>}
  </div>;
}
