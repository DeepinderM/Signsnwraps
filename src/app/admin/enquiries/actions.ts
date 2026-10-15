"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { enquiryStatuses, updateEnquiry, type EnquiryStatus } from "@/lib/services/enquiries";

export async function saveEnquiry(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "") as EnquiryStatus;
  if (!/^[A-Za-z0-9]{1,40}$/.test(id) || !enquiryStatuses.some((item) => item.value === status)) return;
  await updateEnquiry(id, { status, staffNote: String(form.get("staffNote") ?? "").slice(0, 3000) });
  refresh();
}
