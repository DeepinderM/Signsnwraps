import { NextResponse } from "next/server";
import { endSession, startSession } from "@/lib/auth";
import { isAllowedAdmin } from "@/lib/admin-auth";

// Staff sign-in: same session as customers, but only for allow-listed, verified emails.
export async function POST(request: Request) {
  const { idToken } = await request.json().catch(() => ({}));
  const result = await startSession(idToken, (user) => isAllowedAdmin(user.email, user.emailVerified) ? null : `${user.email || "This account"} is not on the staff list.`);
  return "error" in result ? NextResponse.json({ error: result.error }, { status: result.status }) : NextResponse.json({ ok: true });
}

export async function DELETE() {
  await endSession();
  return NextResponse.json({ ok: true });
}
