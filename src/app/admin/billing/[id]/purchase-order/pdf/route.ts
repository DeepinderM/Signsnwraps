import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin-auth";
import { getBillingDoc, getBillingSettings } from "@/lib/billing";
import { renderProductionSheetPdf, renderPurchaseOrderPdf } from "@/lib/po-pdf";
import { getPurchaseOrder, quoteIdFor } from "@/lib/purchase-orders";

/** Staff preview of the saved purchase order (?sheet=1 for the production sheet). Same access rules as the admin page. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return new NextResponse("Sign in required", { status: 401 });
  const doc = await getBillingDoc((await params).id);
  if (!doc || (admin.role !== "super" && doc.store !== admin.store)) return new NextResponse("Not found", { status: 404 });
  const po = await getPurchaseOrder(quoteIdFor(doc));
  if (!po) return new NextResponse("No purchase order yet", { status: 404 });
  const sheet = new URL(request.url).searchParams.get("sheet") === "1";
  const settings = await getBillingSettings();
  const pdf = sheet ? await renderProductionSheetPdf(po, doc.customer, doc.title, settings) : await renderPurchaseOrderPdf(po, doc.customer, doc.title, settings);
  const name = sheet ? `${po.number}-production-sheet.pdf` : `${po.number}.pdf`;
  return new NextResponse(Buffer.from(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${name}"`, "Cache-Control": "private, no-store" } });
}
