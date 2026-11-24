"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { listChat, markChatRead, postChat } from "@/lib/po-chat";
import { getPurchaseOrder } from "@/lib/purchase-orders";

/** Staff side of the PO chat: same store access as the PO page. */
async function access(poId: string) {
  const admin = await requireAdmin();
  const po = /^[A-Za-z0-9_-]{1,64}$/.test(poId) ? await getPurchaseOrder(poId) : null;
  return po && (admin.role === "super" || (!!admin.store && po.store === admin.store)) ? { admin, po } : null;
}

export async function loadStaffChat(poId: string) {
  const ok = await access(poId);
  if (!ok) return { error: "Not available." };
  await markChatRead(poId, "staff");
  return { messages: await listChat(poId) };
}

export async function postStaffChat(poId: string, text: string) {
  const ok = await access(poId);
  if (!ok) return { error: "Not available." };
  const result = await postChat(poId, "staff", text, { name: ok.admin.name || ok.admin.email, email: ok.admin.email });
  if ("error" in result) return { error: result.error! };
  return { messages: await listChat(poId) };
}
