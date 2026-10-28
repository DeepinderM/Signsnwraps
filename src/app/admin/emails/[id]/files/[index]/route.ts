import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin-auth";
import { getBillingDoc } from "@/lib/billing";
import { bucket, db } from "@/lib/firebase/admin";
import { getEnquiry } from "@/lib/services/enquiries";

// Staff downloads of files a customer attached to an email reply, streamed from Storage.
// Same access as the page the conversation lives on: super admins see all; store staff see their
// store's enquiries and quotes/invoices (orders and customer accounts are super-admin only).
// Only images and PDFs may open in the browser; everything else always downloads.
const INLINE_SAFE = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
const asciiName = (name: string) => name.replace(/[^\x20-\x7e]+/g, "_").replace(/["\\]/g, "_");
const disposition = (kind: "inline" | "attachment", name: string) => `${kind}; filename="${asciiName(name)}"; filename*=UTF-8''${encodeURIComponent(name)}`;

async function storeOf(context: { type?: string; id?: string } | undefined) {
  if (!context?.id) return undefined;
  if (context.type === "enquiry") return (await getEnquiry(context.id))?.store ?? undefined;
  if (context.type === "billing") return (await getBillingDoc(context.id))?.store ?? undefined;
  return undefined;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string; index: string }> }) {
  const admin = await getAdmin();
  if (!admin) return new NextResponse("Sign in required", { status: 401 });
  const { id, index } = await params;
  const snapshot = /^[A-Za-z0-9]{1,40}$/.test(id) ? await db().collection("emails").doc(id).get() : null;
  const data = snapshot?.exists ? snapshot.data() : undefined;
  if (!data || (admin.role !== "super" && (await storeOf(data.context)) !== admin.store)) return new NextResponse("Not found", { status: 404 });
  const item = Array.isArray(data.files) && /^\d{1,2}$/.test(index) ? (data.files[Number(index)] as { name: string; path: string; contentType: string } | undefined) : undefined;
  if (!item) return new NextResponse("Not found", { status: 404 });
  const [content] = await bucket().file(item.path).download().catch(() => [null]);
  if (!content) return new NextResponse("This file is no longer available.", { status: 410 });
  const inline = new URL(request.url).searchParams.get("download") !== "1" && INLINE_SAFE.includes(item.contentType);
  return new NextResponse(new Uint8Array(content), { headers: {
    "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    "Content-Type": inline ? item.contentType : "application/octet-stream", "Content-Length": String(content.length),
    "Content-Disposition": disposition(inline ? "inline" : "attachment", item.name),
    ...(inline && item.contentType.startsWith("image/") ? { "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'" } : {}),
  } });
}
