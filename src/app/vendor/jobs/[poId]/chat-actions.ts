"use server";

import { listChat, markChatRead, postChat } from "@/lib/po-chat";
import { getVendorViewer, vendorJob } from "@/lib/vendor-auth";

/** Vendor side of the PO chat: only their own sent jobs (not a super admin preview). */
async function access(poId: string) {
  const viewer = await getVendorViewer();
  const job = viewer ? await vendorJob(viewer, poId) : null;
  return viewer && job ? { viewer, job } : null;
}

export async function loadVendorChat(poId: string) {
  const ok = await access(poId);
  if (!ok) return { error: "Not available." };
  await markChatRead(poId, "vendor");
  return { messages: await listChat(poId) };
}

export async function postVendorChat(poId: string, text: string) {
  const ok = await access(poId);
  if (!ok) return { error: "Please sign in again." };
  const result = await postChat(poId, "vendor", text, { name: `${ok.viewer.name || ok.viewer.email} (${ok.viewer.vendor.name})`, email: ok.viewer.email });
  if ("error" in result) return { error: result.error! };
  return { messages: await listChat(poId) };
}
