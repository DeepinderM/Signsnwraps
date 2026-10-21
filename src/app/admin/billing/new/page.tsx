import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { addDays, getBillingSettings, todayIso } from "@/lib/billing";
import { getEnquiry } from "@/lib/services/enquiries";
import { getDirectoryUser } from "@/lib/users";
import { stores } from "@/lib/staff";
import { AdminNav } from "../../admin-nav";
import { BillingEditor } from "../billing-editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New quote or invoice" };

export default async function NewBillingPage({ searchParams }: { searchParams: Promise<{ kind?: string; enquiry?: string; user?: string }> }) {
  const admin = await requireAdmin();
  const { kind: rawKind, enquiry: enquiryId = "", user: userId = "" } = await searchParams;
  const kind = rawKind === "invoice" ? "invoice" : "quote";
  const settings = await getBillingSettings();
  // Prefill from the enquiry (if staff can see it) or from a customer account (super admins).
  const enquiry = enquiryId && /^[A-Za-z0-9]{1,40}$/.test(enquiryId) ? await getEnquiry(enquiryId) : null;
  const allowedEnquiry = enquiry && (admin.role === "super" || enquiry.store === admin.store) ? enquiry : null;
  const user = !allowedEnquiry && userId && admin.role === "super" && /^[A-Za-z0-9_-]{1,128}$/.test(userId) ? await getDirectoryUser(userId) : null;
  const issueDate = todayIso();
  const initial = {
    store: allowedEnquiry?.store ?? admin.store ?? "",
    customer: { name: allowedEnquiry?.name ?? user?.name ?? "", business: allowedEnquiry?.business ?? "", email: allowedEnquiry?.email ?? user?.email ?? "", phone: allowedEnquiry?.phone ?? user?.phone ?? "", address: "", abn: allowedEnquiry?.details?.ABN ?? "" },
    items: allowedEnquiry ? [{ description: allowedEnquiry.service, qty: 1, unitCents: 0, gst: true }] : [],
    title: allowedEnquiry?.service ?? "", notes: "", issueDate, dueDate: addDays(issueDate, kind === "quote" ? settings.quoteValidDays : settings.paymentTermsDays),
    enquiryId: allowedEnquiry?.id ?? "", userId: user?.uid ?? "",
  };
  return <>
    <AdminNav admin={{ email: admin.email, role: admin.role, store: admin.store }} />
    <Link className="text-link" href={allowedEnquiry ? `/admin/enquiries/${allowedEnquiry.id}` : `/admin/billing?kind=${kind}`}>← {allowedEnquiry ? "Back to enquiry" : "Quotes & invoices"}</Link>
    <div className="admin-head"><div><h1>New {kind === "quote" ? "quote" : settings.gstRegistered ? "tax invoice" : "invoice"}</h1><p>{allowedEnquiry ? `For ${allowedEnquiry.name}'s ${allowedEnquiry.service.toLowerCase()} enquiry. ` : ""}A number is assigned when you create it.</p></div></div>
    <BillingEditor kind={kind} gstRegistered={settings.gstRegistered} stores={admin.role === "super" ? stores : null} initial={initial} />
  </>;
}
