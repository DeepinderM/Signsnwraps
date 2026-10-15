"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { clientAuth, isFirebaseClientConfigured } from "@/lib/firebase/client";

export function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    setBusy(true); setError("");
    try {
      const auth = clientAuth();
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const response = await fetch("/api/admin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: await result.user.getIdToken() }) });
      // The server cookie is the only session we use; drop the client-side Firebase session.
      await signOut(auth);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Sign-in failed.");
      router.replace("/admin/orders");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message.replace(/^Firebase: /, "") : "Sign-in failed.");
      setBusy(false);
    }
  }

  if (!isFirebaseClientConfigured) return <p className="admin-error">Firebase web config is missing. Set the NEXT_PUBLIC_FIREBASE_* variables (see README).</p>;
  return <div><button className="button button-orange" type="button" onClick={signIn} disabled={busy}>{busy ? "Signing in…" : "Sign in with Google"}</button>{error && <p className="admin-error" role="alert">{error}</p>}</div>;
}
