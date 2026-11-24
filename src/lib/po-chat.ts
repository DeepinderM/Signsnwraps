import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";
import { getBillingSettings } from "@/lib/billing";
import { sendCustomerEmail } from "@/lib/email";
import { getPurchaseOrder } from "@/lib/purchase-orders";
import { absoluteUrl } from "@/lib/seo";
import { isEmail } from "@/lib/validation";
import { getVendor } from "@/lib/vendors";
import type { ChatMessage, ChatSide } from "@/lib/po-chat-types";

// Internal chat between the vendor and Signs N Wraps staff on one purchase order (purchaseOrders/{id}/messages).
// The PO keeps the last message and each side's "read up to" time, so lists can show unread badges without reading messages.

const messages = (poId: string) => db().collection("purchaseOrders").doc(poId).collection("messages");
/** Email the other side only for the first message in a burst (nothing from this side in the last 30 minutes). */
const QUIET_MS = 30 * 60 * 1000;

export async function listChat(poId: string): Promise<ChatMessage[]> {
  const snap = await messages(poId).orderBy("at", "asc").limit(500).get();
  return snap.docs.map((doc) => ({ id: doc.id, text: doc.get("text") ?? "", at: doc.get("at") ?? 0, by: doc.get("by") ?? "", side: doc.get("side") === "vendor" ? "vendor" : "staff" }));
}

export async function markChatRead(poId: string, side: ChatSide) {
  await db().collection("purchaseOrders").doc(poId).update({ [side === "vendor" ? "vendorReadAt" : "staffReadAt"]: Date.now() }).catch(() => undefined);
}

/** Adds a message, marks it read for the sender, and emails the other side if this starts a new burst. */
export async function postChat(poId: string, side: ChatSide, text: string, by: { name: string; email: string }) {
  const clean = text.trim().slice(0, 4000);
  if (!clean) return { error: "Write a message." };
  const po = await getPurchaseOrder(poId);
  if (!po || po.status !== "sent") return { error: "Chat opens once the purchase order is sent." };
  // (Recent messages filtered here rather than a side + time query, which would need a composite index.)
  const recent = await messages(poId).orderBy("at", "desc").limit(30).get();
  const lastFromMe = recent.docs.find((doc) => doc.get("side") === side)?.get("at") ?? 0;
  const at = Date.now();
  await messages(poId).add({ text: clean, at, by: by.name || by.email, byEmail: by.email, side });
  await db().collection("purchaseOrders").doc(poId).update({ lastMessageAt: at, lastMessageSide: side, [side === "vendor" ? "vendorReadAt" : "staffReadAt"]: at, chatCount: FieldValue.increment(1) });
  if (at - lastFromMe > QUIET_MS) {
    // Vendor → the sales person who sent the PO (else the business mailbox). Staff → the vendor's login emails (else their PO emails).
    const vendor = await getVendor(po.vendorId);
    const to = side === "vendor" ? [po.sentByEmail, (await getBillingSettings()).email].filter(isEmail).slice(0, 1) : [...(vendor?.loginEmails.length ? vendor.loginEmails : vendor?.emails ?? [])].filter(isEmail);
    const link = side === "vendor" ? absoluteUrl(`/admin/billing/${po.invoiceId || po.id}/purchase-order#chat`) : absoluteUrl(`/vendor/jobs/${po.id}#chat`);
    if (to.length) await sendCustomerEmail({
      to: to.join(", "), subject: `New message on ${po.number} from ${side === "vendor" ? vendor?.name ?? "the vendor" : "Signs N Wraps"}`,
      body: `${by.name || by.email} wrote on ${po.number}:\n\n${clean.slice(0, 1500)}\n\nReply in the portal:\n${link}\n\n(You get one email per conversation burst; please reply in the portal, not to this email.)`,
      sentBy: { name: by.name || by.email, email: by.email }, context: { type: "purchaseOrder", id: po.id },
    }).catch(() => undefined);
  }
  return { ok: true as const };
}
