"use server";

import { refresh } from "next/cache";
import { requireAdmin, type Admin } from "@/lib/admin-auth";
import { addEnquiryNote, assignEnquiry, enquiryStatuses, getEnquiry, setEnquiryStatus, type EnquiryStatus } from "@/lib/services/enquiries";
import { isStoreId } from "@/lib/staff";

export type ActionResult = { ok?: string; error?: string } | null;

const staffName = (admin: Admin) => admin.name || admin.email;

/** Loads an enquiry the signed-in staff member may work on: super admins see all, store staff only their store's. */
async function accessibleEnquiry(form: FormData) {
  const admin = await requireAdmin();
  const id = String(form.get("id") ?? "");
  if (!/^[A-Za-z0-9]{1,40}$/.test(id)) return { admin, enquiry: null };
  const enquiry = await getEnquiry(id);
  return { admin, enquiry: enquiry && (admin.role === "super" || enquiry.store === admin.store) ? enquiry : null };
}

export async function updateStatus(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { admin, enquiry } = await accessibleEnquiry(form);
  const status = String(form.get("status") ?? "") as EnquiryStatus;
  if (!enquiry) return { error: "This enquiry isn't available to you." };
  if (!enquiryStatuses.some((item) => item.value === status)) return { error: "Choose a status." };
  if (status === enquiry.status) return { ok: "No change." };
  await setEnquiryStatus(enquiry.id, status, staffName(admin));
  refresh();
  return { ok: "Status updated." };
}

export async function addNote(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { admin, enquiry } = await accessibleEnquiry(form);
  const text = String(form.get("note") ?? "").trim();
  if (!enquiry) return { error: "This enquiry isn't available to you." };
  if (!text) return { error: "Write a note first." };
  if (text.length > 3000) return { error: "Keep notes under 3,000 characters." };
  await addEnquiryNote(enquiry.id, text, staffName(admin));
  refresh();
  return { ok: "Note added." };
}

/** Super admins only: divert a lead to a store (or back to unassigned). */
export async function divertEnquiry(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { admin, enquiry } = await accessibleEnquiry(form);
  if (admin.role !== "super") return { error: "Only super admins can divert leads." };
  if (!enquiry) return { error: "Enquiry not found." };
  const raw = String(form.get("store") ?? "");
  const store = raw === "" ? null : isStoreId(raw) ? raw : undefined;
  if (store === undefined) return { error: "Choose a store." };
  if (store === enquiry.store) return { ok: "Already with that store." };
  await assignEnquiry(enquiry, store, staffName(admin), String(form.get("reason") ?? "").trim().slice(0, 500));
  refresh();
  return { ok: store ? "Lead diverted. The store's staff have been notified." : "Lead moved back to unassigned." };
}
