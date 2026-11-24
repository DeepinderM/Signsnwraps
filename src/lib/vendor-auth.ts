import "server-only";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin-auth";
import { getBillingDoc } from "@/lib/billing";
import { getPurchaseOrder } from "@/lib/purchase-orders";
import { getEnquiry } from "@/lib/services/enquiries";
import { getSessionUser } from "@/lib/auth";
import type { Vendor } from "@/lib/vendor-types";
import { getVendor, vendorForLogin } from "@/lib/vendors";

// Vendor dashboard access: a signed-in user whose verified email is on a vendor's login list (Vendors page, super
// admin). A super admin can also open any vendor's dashboard (?vendor=<id>) to see what that vendor sees.

export type VendorViewer = { email: string; name: string; vendor: Vendor; preview: boolean };

export async function getVendorViewer(previewId?: string): Promise<VendorViewer | null> {
  const user = await getSessionUser();
  if (!user) return null;
  if (previewId) {
    const admin = await getAdmin();
    const vendor = admin?.role === "super" ? await getVendor(previewId) : null;
    if (vendor) return { email: user.email, name: admin!.name, vendor, preview: true };
  }
  if (!user.emailVerified) return null;
  const vendor = await vendorForLogin(user.email);
  return vendor ? { email: user.email, name: user.name, vendor, preview: false } : null;
}

export async function requireVendor(previewId?: string) {
  const viewer = await getVendorViewer(previewId);
  if (!viewer) redirect("/vendor/login");
  return viewer;
}

/** A sent PO for this viewer's vendor, with its job and attached artwork; null if it isn't theirs. */
export async function vendorJob(viewer: VendorViewer, poId: string) {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(poId)) return null;
  const po = await getPurchaseOrder(poId);
  if (!po || po.vendorId !== viewer.vendor.id || po.status !== "sent") return null;
  const doc = await getBillingDoc(po.id);
  if (!doc) return null;
  const enquiry = doc.enquiryId ? await getEnquiry(doc.enquiryId) : null;
  const files = [...(enquiry?.files ?? []).filter((file) => po.artwork.includes(file.path)), ...po.uploads];
  return { po, doc, files };
}
