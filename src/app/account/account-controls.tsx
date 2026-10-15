"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { sendEmailVerification, signOut } from "firebase/auth";
import { clientAuth, isFirebaseClientConfigured } from "@/lib/firebase/client";
import { updateProfile, type ProfileState } from "./actions";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function signOutEverywhere() {
    setBusy(true);
    await fetch("/api/auth/session", { method: "DELETE" });
    if (isFirebaseClientConfigured) await signOut(clientAuth()).catch(() => undefined);
    router.replace("/");
    router.refresh();
  }
  return <button className="button button-light" type="button" onClick={signOutEverywhere} disabled={busy}>{busy ? "Signing out…" : "Sign out"}</button>;
}

export function ResendVerification() {
  const [state, setState] = useState<"idle" | "sent" | "relogin" | "error">("idle");
  async function resend() {
    const user = isFirebaseClientConfigured ? clientAuth().currentUser : null;
    if (!user) return setState("relogin");
    try { await sendEmailVerification(user, { url: `${window.location.origin}/account` }); setState("sent"); } catch { setState("error"); }
  }
  if (state === "sent") return <span className="account-ok">Verification email sent. Check your inbox, then sign in again.</span>;
  if (state === "relogin") return <span>Sign out and sign in again, then resend.</span>;
  return <><button className="text-button" type="button" onClick={resend}>Resend verification email</button>{state === "error" && <span className="account-error"> Couldn't send right now. Try again shortly.</span>}</>;
}

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {});
  return <form action={action} className="account-profile">
    <div className="field"><label htmlFor="profile-name">Name</label><input id="profile-name" name="name" defaultValue={name} autoComplete="name" maxLength={120} /></div>
    <div className="field"><label htmlFor="profile-phone">Phone</label><input id="profile-phone" name="phone" defaultValue={phone} type="tel" autoComplete="tel" /></div>
    <button className="button" type="submit" disabled={pending}>{pending ? "Saving…" : "Save details"}</button>
    {state.error && <p className="account-error" role="alert">{state.error}</p>}
    {state.saved && <p className="account-ok" role="status">Saved.</p>}
  </form>;
}
