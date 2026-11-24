import { NextResponse } from "next/server";
import { runDayBeforeCheck } from "@/lib/installation-notify";

// Vercel Cron (vercel.json) calls this every morning with "Authorization: Bearer $CRON_SECRET".
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET isn't set" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const result = await runDayBeforeCheck();
  return NextResponse.json({ ok: true, date: result.date, installations: result.count });
}
