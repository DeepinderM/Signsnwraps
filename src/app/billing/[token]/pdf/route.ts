import { NextResponse } from "next/server";
import { getBillingDocByToken, getBillingSettings } from "@/lib/billing";
import { renderBillingPdf } from "@/lib/billing-pdf";
import { billingViewUrl } from "@/lib/billing-links";
import { getAdmin } from "@/lib/admin-auth";

/** Customer PDF download via the private link (drafts stay hidden until sent). */
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const doc = await getBillingDocByToken((await params).token);
  if (!doc) return new NextResponse("Not found", { status: 404 });
  if (doc.status === "draft") { const admin = await getAdmin(); if (!admin || (admin.role !== "super" && admin.store !== doc.store)) return new NextResponse("Not found", { status: 404 }); }
  const pdf = await renderBillingPdf(doc, await getBillingSettings(), billingViewUrl(doc.token));
  return new NextResponse(Buffer.from(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${doc.number}.pdf"`, "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" } });
}
