import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin-auth";
import { bucket } from "@/lib/firebase/admin";
import { getEnquiry } from "@/lib/services/enquiries";
import { createZip } from "@/lib/zip";

// Staff downloads of enquiry attachments, streamed from Storage after the same access check as the
// enquiry page (super admins: all; store staff: their store's). /files/<n> = one file, /files/all = zip.
// Only images and PDFs may open in the browser; everything else (SVG, AI, EPS, HEIC…) always downloads.
const INLINE_SAFE = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
const asciiName = (name: string) => name.replace(/[^\x20-\x7e]+/g, "_").replace(/["\\]/g, "_");
const disposition = (kind: "inline" | "attachment", name: string) => `${kind}; filename="${asciiName(name)}"; filename*=UTF-8''${encodeURIComponent(name)}`;

export async function GET(request: Request, { params }: { params: Promise<{ id: string; file: string }> }) {
  const admin = await getAdmin();
  if (!admin) return new NextResponse("Sign in required", { status: 401 });
  const { id, file } = await params;
  const enquiry = /^[A-Za-z0-9]{1,40}$/.test(id) ? await getEnquiry(id) : null;
  if (!enquiry || (admin.role !== "super" && enquiry.store !== admin.store)) return new NextResponse("Not found", { status: 404 });
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

  if (file === "all") {
    if (!enquiry.files.length) return new NextResponse("No attachments", { status: 404 });
    const files = await Promise.all(enquiry.files.map(async (item) => ({ name: item.name, data: new Uint8Array((await bucket().file(item.path).download())[0]) })));
    const zip = createZip(files);
    const name = `${enquiry.name || "enquiry"}-attachments.zip`.replace(/[^\w.\- ]+/g, "_");
    return new NextResponse(Buffer.from(zip), { headers: { ...headers, "Content-Type": "application/zip", "Content-Disposition": disposition("attachment", name) } });
  }

  const index = Number(file);
  const item = Number.isInteger(index) ? enquiry.files[index] : undefined;
  if (!item) return new NextResponse("Not found", { status: 404 });
  const [data] = await bucket().file(item.path).download().catch(() => [null]);
  if (!data) return new NextResponse("This file is no longer available.", { status: 410 });
  const inline = new URL(request.url).searchParams.get("download") !== "1" && INLINE_SAFE.includes(item.contentType);
  return new NextResponse(new Uint8Array(data), { headers: {
    ...headers, "Content-Type": inline ? item.contentType : "application/octet-stream", "Content-Length": String(data.length),
    "Content-Disposition": disposition(inline ? "inline" : "attachment", item.name),
    // Images open in a locked-down sandbox; Chrome's PDF viewer doesn't run under a sandbox CSP.
    ...(inline && item.contentType.startsWith("image/") ? { "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'" } : {}),
  } });
}
