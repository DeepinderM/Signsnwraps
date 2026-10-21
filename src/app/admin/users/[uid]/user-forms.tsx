"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { changeRole, toggleBlocked, type UserResult } from "../actions";

function Feedback({ state }: { state: UserResult }) {
  if (!state) return null;
  return state.error ? <p className="admin-error" role="alert">{state.error}</p> : <p className="admin-ok" role="status">{state.ok}</p>;
}

/** Submits without React's automatic form reset, so selects keep showing the saved value. */
const submitWithoutReset = (action: (form: FormData) => void) => (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  startTransition(() => action(form));
};

export function RoleForm({ uid, role, store, stores }: { uid: string; role: string; store: string | null; stores: { value: string; label: string }[] }) {
  const [state, action, pending] = useActionState(changeRole, null);
  const [value, setValue] = useState(role);
  const [storeValue, setStoreValue] = useState(store ?? "");
  return <form onSubmit={submitWithoutReset(action)} className="admin-form"><input type="hidden" name="uid" value={uid} />
    <div className="field"><label htmlFor="role">Access</label><select id="role" name="role" value={value} onChange={(event) => setValue(event.target.value)}>
      <option value="customer">Customer (no admin access)</option><option value="store">Store staff</option><option value="super">Super admin</option>
    </select></div>
    {value === "store" && <div className="field"><label htmlFor="store">Store</label><select id="store" name="store" value={storeValue} onChange={(event) => setStoreValue(event.target.value)} required>
      <option value="" disabled>Choose a store</option>{stores.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
    </select></div>}
    <button className="button button-orange" type="submit" disabled={pending}>{pending ? "Saving…" : "Save access"}</button>
    <Feedback state={state} />
  </form>;
}

export function BlockForm({ uid, disabled }: { uid: string; disabled: boolean }) {
  const [state, action, pending] = useActionState(toggleBlocked, null);
  const [confirming, setConfirming] = useState(false);
  return <form onSubmit={submitWithoutReset((form) => { setConfirming(false); action(form); })} className="admin-form"><input type="hidden" name="uid" value={uid} />
    {disabled ? <button className="button button-orange" type="submit" disabled={pending}>{pending ? "Saving…" : "Unblock account"}</button>
      : confirming ? <div className="admin-confirm"><span>Block this account and sign them out everywhere?</span><button className="button admin-delete" type="submit" disabled={pending}>{pending ? "Blocking…" : "Yes, block"}</button><button className="button button-light" type="button" onClick={() => setConfirming(false)}>Cancel</button></div>
      : <button className="button button-light" type="button" onClick={() => setConfirming(true)}>Block account</button>}
    <Feedback state={state} />
  </form>;
}
