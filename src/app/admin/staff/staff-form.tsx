"use client";

import { useActionState, useState } from "react";
import { saveStaff } from "./actions";

export function StaffForm({ stores }: { stores: { value: string; label: string }[] }) {
  const [state, action, pending] = useActionState(saveStaff, null);
  const [role, setRole] = useState("store");
  return <form action={action} className="admin-form admin-staff-form">
    <div className="field"><label htmlFor="staff-email">Google email</label><input id="staff-email" name="email" type="email" required placeholder="name@gmail.com" /></div>
    <div className="field"><label htmlFor="staff-name">Name</label><input id="staff-name" name="name" maxLength={80} placeholder="Optional" /></div>
    <div className="field"><label htmlFor="staff-role">Role</label><select id="staff-role" name="role" value={role} onChange={(event) => setRole(event.target.value)}><option value="store">Store staff</option><option value="super">Super admin</option></select></div>
    <div className="field"><label htmlFor="staff-store">Store</label><select id="staff-store" name="store" disabled={role !== "store"} defaultValue="">{role === "store" ? <><option value="" disabled>Choose a store</option>{stores.map((store) => <option key={store.value} value={store.value}>{store.label}</option>)}</> : <option value="">All stores</option>}</select></div>
    <button className="button button-orange" type="submit" disabled={pending}>{pending ? "Saving…" : "Save staff"}</button>
    {state?.error && <p className="admin-error" role="alert">{state.error}</p>}
    {state?.ok && <p className="admin-ok" role="status">{state.ok}</p>}
  </form>;
}
