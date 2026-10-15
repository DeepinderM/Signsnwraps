import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth, isFirebaseConfigured } from "@/lib/firebase/admin";

// One sign-in system for customers and staff: a Firebase Auth session in an httpOnly cookie.
// Staff are the signed-in users whose verified email is on ADMIN_EMAILS (see admin-auth.ts).

// Firebase Hosting/App Hosting only forward a cookie named __session to the app.
export const SESSION_COOKIE = "__session";
export const SESSION_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000;
/** createSessionCookie requires a recent sign-in. */
const MAX_SIGN_IN_AGE_S = 5 * 60;

export type SessionUser = { uid: string; email: string; emailVerified: boolean; name: string; provider: string };

function toUser(decoded: DecodedIdToken): SessionUser {
  return { uid: decoded.uid, email: decoded.email ?? "", emailVerified: decoded.email_verified === true, name: typeof decoded.name === "string" ? decoded.name : "", provider: decoded.firebase?.sign_in_provider ?? "" };
}

/** The signed-in user (customer or staff), or null. Checks revocation; cached per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!isFirebaseConfigured()) return null;
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    return toUser(await adminAuth().verifySessionCookie(cookie, true));
  } catch {
    return null;
  }
});

export async function requireUser(next = "/account") {
  const user = await getSessionUser();
  if (!user) redirect(`/account/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Verifies a fresh ID token from the browser and sets the session cookie. Returns the user or an error message. */
export async function startSession(idToken: unknown, allow?: (user: SessionUser) => string | null): Promise<{ user: SessionUser } | { error: string; status: number }> {
  if (!isFirebaseConfigured()) return { error: "Sign-in is not available right now.", status: 503 };
  if (typeof idToken !== "string" || idToken.length > 4096) return { error: "Missing sign-in token.", status: 400 };
  try {
    const decoded = await adminAuth().verifyIdToken(idToken, true);
    if (Date.now() / 1000 - decoded.auth_time > MAX_SIGN_IN_AGE_S) return { error: "Please sign in again.", status: 401 };
    const user = toUser(decoded);
    const denied = allow?.(user);
    if (denied) return { error: denied, status: 403 };
    const session = await adminAuth().createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS });
    (await cookies()).set(SESSION_COOKIE, session, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE_MS / 1000 });
    return { user };
  } catch {
    return { error: "Sign-in could not be verified.", status: 401 };
  }
}

/** Clears the cookie and revokes the user's refresh tokens (signs them out on every device). */
export async function endSession() {
  const jar = await cookies();
  const session = jar.get(SESSION_COOKIE)?.value;
  jar.delete(SESSION_COOKIE);
  if (session && isFirebaseConfigured()) {
    await adminAuth().verifySessionCookie(session).then((decoded) => adminAuth().revokeRefreshTokens(decoded.sub)).catch(() => undefined);
  }
}
