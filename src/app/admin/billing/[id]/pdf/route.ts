import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin-auth";
import { getBillingDoc, getBillingSettings } from "@/lib/billing";
import { renderBillingPdf } from "@/lib/billing-pdf";
import { billingViewUrl } from "@/lib/billing-links";

/** Staff PDF preview (same access rules as the admin page). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return new NextResponse("Sign in required", { status: 401 });
  const doc = await getBillingDoc((await params).id);
  if (!doc || (admin.role !== "super" && doc.store !== admin.store)) return new NextResponse("Not found", { status: 404 });
  const pdf = await renderBillingPdf(doc, await getBillingSettings(), billingViewUrl(doc.token));
  return new NextResponse(Buffer.from(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${doc.number}.pdf"`, "Cache-Control": "private, no-store" } });
}
