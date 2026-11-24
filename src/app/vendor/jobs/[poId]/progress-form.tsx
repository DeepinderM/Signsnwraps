"use client";

import { useActionState, useState } from "react";
import { PROGRESS_STAGES, progressIndex, type ProgressEvent, type ProgressStage } from "@/lib/vendor-types";
import { updateJobProgress } from "./actions";

const stamp = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Melbourne" });

/** Progress tracker for a job: the stages as steps, an update form (vendor only) and the update log. */
export function ProgressTracker({ poId, stage, log, canUpdate }: { poId: string; stage: ProgressStage; log: ProgressEvent[]; canUpdate: boolean }) {
  const [state, update, saving] = useActionState(updateJobProgress, null);
  const current = progressIndex(stage);
  const next = PROGRESS_STAGES[Math.min(current + 1, PROGRESS_STAGES.length - 1)].key;
  const [chosen, setChosen] = useState<ProgressStage>(stage === "installed" ? "installed" : next);
  const [note, setNote] = useState("");
  const [doneAt, setDoneAt] = useState<number | undefined>();
  // After a successful update: clear the note and move the picker on to the next stage (adjusting state during render, per the React docs).
  if (state?.at && state.at !== doneAt && state.ok) {
    setDoneAt(state.at); setNote("");
    setChosen(PROGRESS_STAGES[Math.min(progressIndex(chosen) + 1, PROGRESS_STAGES.length - 1)].key);
  }

  return <div className="vendor-card progress-card">
    <h2>Job progress</h2>
    <ol className="progress-steps">{PROGRESS_STAGES.map((item, index) => <li key={item.key} className={index < current ? "is-done" : index === current ? "is-current" : ""}><span className="progress-dot" aria-hidden>{index < current ? "✓" : index + 1}</span><span><b>{item.label}</b><small>{item.detail}</small></span></li>)}</ol>
    {canUpdate && <form action={update} className="progress-form">
      <input type="hidden" name="poId" value={poId} />
      <div className="field"><label htmlFor="progress-stage">Update to</label><select id="progress-stage" name="stage" value={chosen} onChange={(event) => setChosen(event.target.value as ProgressStage)}>{PROGRESS_STAGES.filter((item) => item.key !== "new").map((item) => <option key={item.key} value={item.key}>{item.label}{item.key === stage ? " (current)" : ""}</option>)}</select></div>
      <div className="field"><label htmlFor="progress-note">Note (optional)</label><input id="progress-note" name="note" value={note} maxLength={1000} onChange={(event) => setNote(event.target.value)} placeholder="e.g. Proof emailed, installation booked for Friday 9am" /></div>
      <button type="submit" className="button button-orange" disabled={saving}>{saving ? "Updating…" : "Update progress"}</button>
      {state?.error && <p className="admin-error" role="alert">{state.error}</p>}
      {state?.ok && <p className="admin-ok" role="status">{state.ok} Signs N Wraps has been notified.</p>}
    </form>}
    {log.length > 0 && <><h3>Updates</h3><ul className="progress-log">{[...log].reverse().map((event) => <li key={`${event.at}-${event.stage}`}><b>{PROGRESS_STAGES.find((item) => item.key === event.stage)?.label}</b>{event.note && <span>{event.note}</span>}<small>{event.by} · {stamp.format(event.at)}</small></li>)}</ul></>}
  </div>;
}
