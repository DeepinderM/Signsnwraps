import { NextResponse } from "next/server";
import { endSession, startSession } from "@/lib/auth";

// Customer sign-in: exchanges a fresh Firebase ID token for the httpOnly session cookie.
export async function POST(request: Request) {
  const { idToken } = await request.json().catch(() => ({}));
  const result = await startSession(idToken);
  return "error" in result ? NextResponse.json({ error: result.error }, { status: result.status }) : NextResponse.json({ ok: true });
}

export async function DELETE() {
  await endSession();
  return NextResponse.json({ ok: true });
}
