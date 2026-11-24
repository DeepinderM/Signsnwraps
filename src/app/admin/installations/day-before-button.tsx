"use client";

import { useActionState } from "react";
import { runDayBeforeCheckNow } from "./actions";

/** Super admin: run the day-before weather check and staff emails now (it also runs automatically every morning). */
export function DayBeforeButton() {
  const [state, run, busy] = useActionState(runDayBeforeCheckNow, null);
  return <form action={run} className="inst-run">
    <button className="button button-light" type="submit" disabled={busy}>{busy ? "Checking…" : "Run tomorrow's check now"}</button>
    {state?.ok && <small className="admin-ok">{state.ok}</small>}{state?.error && <small className="admin-error">{state.error}</small>}
  </form>;
}
