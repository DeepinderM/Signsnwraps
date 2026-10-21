"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { respondToQuote } from "./actions";

export function QuoteResponse({ token, name }: { token: string; name: string }) {
  const [state, action, pending] = useActionState(respondToQuote, null);
  const [declining, setDeclining] = useState(false);
  const submit = (decision: "accept" | "decline") => (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); form.set("decision", decision); form.set("token", token); startTransition(() => action(form));
  };
  if (state?.ok) return <p className="doc-done" role="status">{state.ok}</p>;
  return <div className="doc-respond">
    {!declining ? <form onSubmit={submit("accept")}>
      <label htmlFor="accept-name">Your name</label>
      <input id="accept-name" name="name" defaultValue={name} required maxLength={120} autoComplete="name" />
      <p>By accepting, you agree to the quote and terms above.</p>
      <button className="button button-orange" type="submit" disabled={pending}>{pending ? "Accepting…" : "Accept quote"}</button>
      <button className="doc-link" type="button" onClick={() => setDeclining(true)}>Decline this quote</button>
    </form> : <form onSubmit={submit("decline")}>
      <label htmlFor="decline-note">Anything we should know? (optional)</label>
      <textarea id="decline-note" name="note" rows={3} maxLength={1000} />
      <button className="button button-light" type="submit" disabled={pending}>{pending ? "Sending…" : "Decline quote"}</button>
      <button className="doc-link" type="button" onClick={() => setDeclining(false)}>Back</button>
    </form>}
    {state?.error && <p className="doc-error" role="alert">{state.error}</p>}
  </div>;
}
