import { NextResponse } from "next/server";
import { bucket } from "@/lib/firebase/admin";
import { getVendorViewer, vendorJob } from "@/lib/vendor-auth";

/** Downloads one artwork file attached to the signed-in vendor's job. */
export async function GET(request: Request, { params }: { params: Promise<{ poId: string; index: string }> }) {
  const viewer = await getVendorViewer(new URL(request.url).searchParams.get("vendor") ?? undefined);
  if (!viewer) return new NextResponse("Sign in required", { status: 401 });
  const { poId, index } = await params;
  const job = await vendorJob(viewer, poId);
  const file = job?.files[Number(index)];
  if (!file || !/^\d+$/.test(index)) return new NextResponse("Not found", { status: 404 });
  const [content] = await bucket().file(file.path).download().catch(() => [null]);
  if (!content) return new NextResponse("File unavailable", { status: 404 });
  return new NextResponse(new Uint8Array(content), { headers: { "Content-Type": file.contentType || "application/octet-stream", "Content-Disposition": `attachment; filename="${file.name.replace(/["\\\r\n]/g, "_")}"`, "Cache-Control": "private, no-store" } });
}
