"use server";

import { refresh } from "next/cache";
import { setBillingStatus } from "@/lib/billing";
import { sendCustomerEmail } from "@/lib/email";
import { updatePoProgress } from "@/lib/purchase-orders";
import { addEnquiryNote } from "@/lib/services/enquiries";
import { getVendorViewer, vendorJob } from "@/lib/vendor-auth";
import { isProgressStage, progressLabel } from "@/lib/vendor-types";
import { isEmail } from "@/lib/validation";
import { absoluteUrl } from "@/lib/seo";

export type ProgressResult = { ok?: string; error?: string; at?: number } | null;

/** The vendor updates a job's progress. Staff see it on the PO and invoice; the sales person who sent the PO gets an email. */
export async function updateJobProgress(_: ProgressResult, form: FormData): Promise<ProgressResult> {
  const viewer = await getVendorViewer();
  if (!viewer) return { error: "Please sign in again." };
  const job = await vendorJob(viewer, String(form.get("poId") ?? ""));
  if (!job) return { error: "This job isn't available to you." };
  const stage = String(form.get("stage") ?? ""), note = String(form.get("note") ?? "").trim().slice(0, 1000);
  if (!isProgressStage(stage) || stage === "new") return { error: "Choose a stage." };
  if (stage === job.po.progress && !note) return { error: "The job is already at this stage. Add a note to post an update." };
  const by = `${viewer.name || viewer.email} (${viewer.vendor.name})`;
  await updatePoProgress(job.po.id, stage, note, by);
  const text = `${job.po.number} progress: ${progressLabel(stage)}${note ? ` (${note})` : ""}, updated by ${by}`;
  await Promise.all([job.doc.id, job.po.invoiceId].filter(Boolean).map((id) => setBillingStatus(id, {}, by, text).catch(() => undefined)));
  if (job.doc.enquiryId) await addEnquiryNote(job.doc.enquiryId, text, by).catch(() => undefined);
  if (isEmail(job.po.sentByEmail)) {
    const link = absoluteUrl(`/admin/billing/${job.po.invoiceId || job.doc.id}/purchase-order`);
    await sendCustomerEmail({
      to: job.po.sentByEmail, subject: `${job.po.number}${job.doc.title ? ` (${job.doc.title})` : ""}: ${progressLabel(stage)}`,
      body: `${viewer.vendor.name} updated ${job.po.number}${job.doc.title ? ` for ${job.doc.title}` : ""}.\n\nProgress: ${progressLabel(stage)}${note ? `\nNote: ${note}` : ""}\nUpdated by: ${viewer.name || viewer.email}\n\nView the purchase order:\n${link}`,
      sentBy: { name: by, email: viewer.email }, context: { type: "purchaseOrder", id: job.po.id },
    }).catch(() => undefined);
  }
  refresh();
  return { ok: `Updated to ${progressLabel(stage)}.`, at: Date.now() };
}
