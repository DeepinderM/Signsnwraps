"use client";

import { startTransition, useActionState, useState } from "react";
import { Check, Copy } from "lucide-react";
import { updateBillingStatus } from "../actions";

/** Status buttons for a quote or invoice. */
export function StatusButtons({ id, buttons }: { id: string; buttons: { action: string; label: string; tone?: "primary" | "danger" }[] }) {
  const [state, act, pending] = useActionState(updateBillingStatus, null);
  const [confirm, setConfirm] = useState("");
  const run = (action: string) => { const form = new FormData(); form.set("id", id); form.set("action", action); setConfirm(""); startTransition(() => act(form)); };
  return <div className="bill-actions-row">
    {buttons.map((button) => button.tone === "danger" && confirm !== button.action
      ? <button key={button.action} type="button" className="button button-light" onClick={() => setConfirm(button.action)} disabled={pending}>{button.label}</button>
      : <button key={button.action} type="button" className={`button ${button.tone === "danger" ? "admin-delete" : button.tone === "primary" ? "button-orange" : "button-light"}`} onClick={() => run(button.action)} disabled={pending}>{button.tone === "danger" ? `Confirm: ${button.label.toLowerCase()}` : button.label}</button>)}
    {state?.error && <p className="admin-error" role="alert">{state.error}</p>}
    {state?.ok && <p className="admin-ok" role="status">{state.ok}</p>}
  </div>;
}

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return <div className="bill-link"><input readOnly value={url} aria-label="Customer link" onFocus={(event) => event.target.select()} />
    <button type="button" className="button button-light" onClick={() => { navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }}>{copied ? <><Check aria-hidden /> Copied</> : <><Copy aria-hidden /> Copy</>}</button></div>;
}
