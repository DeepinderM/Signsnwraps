import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Uptime/monitoring check. */
export function GET() {
  return NextResponse.json({ ok: true, node: process.version, region: process.env.VERCEL_REGION ?? null });
}
