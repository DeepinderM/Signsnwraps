"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, GoogleAuthProvider, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, updateProfile, type User } from "firebase/auth";
import { clientAuth, isFirebaseClientConfigured } from "@/lib/firebase/client";

type Mode = "signin" | "signup" | "reset";

const messages: Record<string, string> = {
  "auth/invalid-credential": "That email and password don't match. Try again or reset your password.",
  "auth/user-not-found": "That email and password don't match. Try again or reset your password.",
  "auth/wrong-password": "That email and password don't match. Try again or reset your password.",
  "auth/email-already-in-use": "There's already an account with this email. Sign in instead.",
  "auth/weak-password": "Use a password of at least 8 characters.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
  "auth/popup-blocked": "Your browser blocked the Google sign-in window. Allow pop-ups and try again.",
  "auth/network-request-failed": "Connection problem. Check your internet and try again.",
};
const friendly = (error: unknown) => error instanceof FirebaseError ? messages[error.code] ?? "Sign-in didn't work. Please try again." : error instanceof Error ? error.message : "Sign-in didn't work. Please try again.";

export function AuthForm({ next }: { next: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Hand the fresh Firebase sign-in to the server, which sets the httpOnly session cookie.
  async function startSession(user: User) {
    const response = await fetch("/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: await user.getIdToken(true) }) }); // fresh token so a just-set display name is included
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Sign-in didn't work. Please try again.");
    router.replace(next);
    router.refresh();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setBusy(true); setError(""); setNotice("");
    try {
      const auth = clientAuth();
      if (mode === "reset") {
        await sendPasswordResetEmail(auth, email, { url: `${window.location.origin}/account/login` });
        setNotice("If there's an account for that email, we've sent a link to reset your password.");
      } else if (mode === "signup") {
        if (password.length < 8) throw new Error("Use a password of at least 8 characters.");
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        const name = String(form.get("name") ?? "").trim();
        if (name) await updateProfile(user, { displayName: name });
        await sendEmailVerification(user, { url: `${window.location.origin}/account` }).catch(() => undefined);
        await startSession(user);
      } else {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        await startSession(user);
      }
    } catch (reason) {
      setError(friendly(reason));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true); setError(""); setNotice("");
    try {
      const { user } = await signInWithPopup(clientAuth(), new GoogleAuthProvider());
      await startSession(user);
    } catch (reason) {
      if (!(reason instanceof FirebaseError && reason.code === "auth/popup-closed-by-user")) setError(friendly(reason));
    } finally {
      setBusy(false);
    }
  }

  if (!isFirebaseClientConfigured) return <p className="account-error">Accounts aren't available right now. You can still check out as a guest.</p>;

  return <div className="auth-card">
    {mode !== "reset" && <div className="auth-tabs" role="tablist">
      <button type="button" role="tab" aria-selected={mode === "signin"} onClick={() => { setMode("signin"); setError(""); }}>Sign in</button>
      <button type="button" role="tab" aria-selected={mode === "signup"} onClick={() => { setMode("signup"); setError(""); }}>Create account</button>
    </div>}
    {mode === "reset" && <h2 className="auth-title">Reset your password</h2>}
    {mode !== "reset" && <><button className="auth-google" type="button" onClick={google} disabled={busy}><GoogleMark /> Continue with Google</button><p className="auth-or"><span>or with email</span></p></>}
    <form onSubmit={submit} className="auth-fields">
      {mode === "signup" && <div className="field"><label htmlFor="auth-name">Your name</label><input id="auth-name" name="name" autoComplete="name" maxLength={120} /></div>}
      <div className="field"><label htmlFor="auth-email">Email</label><input id="auth-email" name="email" type="email" autoComplete="email" required /></div>
      {mode !== "reset" && <div className="field"><label htmlFor="auth-password">Password</label><input id="auth-password" name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={mode === "signup" ? 8 : undefined} required />{mode === "signup" && <small>At least 8 characters.</small>}</div>}
      {error && <p className="account-error" role="alert">{error}</p>}
      {notice && <p className="account-ok" role="status">{notice}</p>}
      <button className="button button-orange auth-submit" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}</button>
    </form>
    <p className="auth-foot">{mode === "reset" ? <button type="button" onClick={() => { setMode("signin"); setNotice(""); }}>← Back to sign in</button> : <button type="button" onClick={() => { setMode("reset"); setError(""); }}>Forgot your password?</button>}</p>
  </div>;
}

function GoogleMark() {
  return <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6.1C12.4 13.7 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.8-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.2-8.5 2.2-6.3 0-11.6-4.2-13.5-10l-7.8 6.1C6.6 42.6 14.6 48 24 48z"/></svg>;
}
