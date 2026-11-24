import { NextResponse } from "next/server";
import { getBillingSettings } from "@/lib/billing";
import { renderProductionSheetPdf, renderPurchaseOrderPdf } from "@/lib/po-pdf";
import { getVendorViewer, vendorJob } from "@/lib/vendor-auth";

/** The PO (or ?sheet=1 the production sheet) for one of the signed-in vendor's jobs. */
export async function GET(request: Request, { params }: { params: Promise<{ poId: string }> }) {
  const url = new URL(request.url);
  const viewer = await getVendorViewer(url.searchParams.get("vendor") ?? undefined);
  if (!viewer) return new NextResponse("Sign in required", { status: 401 });
  const job = await vendorJob(viewer, (await params).poId);
  if (!job) return new NextResponse("Not found", { status: 404 });
  const sheet = url.searchParams.get("sheet") === "1", settings = await getBillingSettings();
  const pdf = sheet ? await renderProductionSheetPdf(job.po, job.doc.customer, job.doc.title, settings) : await renderPurchaseOrderPdf(job.po, job.doc.customer, job.doc.title, settings);
  return new NextResponse(Buffer.from(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${job.po.number}${sheet ? "-production-sheet" : ""}.pdf"`, "Cache-Control": "private, no-store" } });
}
