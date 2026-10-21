import { NextResponse } from "next/server";
import { createUploadSession } from "@/lib/services/uploads";

/** Issues a short-lived upload session for the booking / quote form's file uploader. */
export async function POST() {
  try {
    return NextResponse.json(await createUploadSession(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Upload session failed", error);
    return NextResponse.json({ error: "File uploads aren't available right now. You can email files to us instead." }, { status: 503 });
  }
}
