"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { addNote, divertEnquiry, updateStatus, type ActionResult } from "../actions";

type Option = { value: string; label: string };

/** Submits without React's automatic form reset, so selects keep showing the saved value. */
const submitWithoutReset = (action: (form: FormData) => void) => (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  startTransition(() => action(form));
};

function Feedback({ state }: { state: ActionResult }) {
  if (!state) return null;
  return state.error ? <p className="admin-error" role="alert">{state.error}</p> : <p className="admin-ok" role="status">{state.ok}</p>;
}

export function StatusForm({ id, status, statuses }: { id: string; status: string; statuses: Option[] }) {
  const [state, action, pending] = useActionState(updateStatus, null);
  const [value, setValue] = useState(status);
  return <form onSubmit={submitWithoutReset(action)} className="admin-form admin-inline-form"><input type="hidden" name="id" value={id} />
    <div className="field"><label htmlFor="status">Status</label><select id="status" name="status" value={value} onChange={(event) => setValue(event.target.value)}>{statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
    <button className="button button-orange" type="submit" disabled={pending}>{pending ? "Saving…" : "Update status"}</button>
    <Feedback state={state} />
  </form>;
}

export function DivertForm({ id, store, suggested, stores }: { id: string; store: string | null; suggested: string | null; stores: Option[] }) {
  const [state, action, pending] = useActionState(divertEnquiry, null);
  const [value, setValue] = useState(store ?? suggested ?? "");
  return <form onSubmit={submitWithoutReset(action)} className="admin-form"><input type="hidden" name="id" value={id} />
    <div className="field"><label htmlFor="store">Divert to store</label><select id="store" name="store" value={value} onChange={(event) => setValue(event.target.value)}>
      <option value="">Unassigned</option>
      {stores.map((item) => <option key={item.value} value={item.value}>{item.label}{item.value === suggested ? " · customer's region" : ""}</option>)}
    </select></div>
    <div className="field"><label htmlFor="reason">Message to the store (optional)</label><input id="reason" name="reason" maxLength={500} placeholder="e.g. Fleet of 12 utes, call before Friday" /></div>
    <button className="button button-orange" type="submit" disabled={pending}>{pending ? "Diverting…" : store ? "Re-divert lead" : "Divert lead"}</button>
    <Feedback state={state} />
  </form>;
}

export function NoteForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(addNote, null);
  return <form action={action} className="admin-form"><input type="hidden" name="id" value={id} />
    <div className="field"><label htmlFor="note">Add an internal note</label><textarea id="note" name="note" maxLength={3000} required placeholder="Called 14 Oct, booked Tue 10am…" /></div>
    <button className="button button-orange" type="submit" disabled={pending}>{pending ? "Adding…" : "Add note"}</button>
    <Feedback state={state} />
  </form>;
}
