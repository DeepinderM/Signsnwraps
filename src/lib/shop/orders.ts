import "server-only";
import { revalidateTag } from "next/cache";
import type Stripe from "stripe";
import { FieldValue, type DocumentData } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";
import { getStripe } from "@/lib/stripe";
import type { DeliveryMethod, Order, OrderAddress, OrderStatus } from "./catalog";
import { orderStatuses } from "./catalog";
import { PRODUCTS_TAG, productsCollection } from "./products";

const ordersCollection = () => db().collection("orders");

function orderNumber(createdAt: Date) {
  const date = createdAt.toISOString().slice(2, 10).replace(/-/g, "");
  return `SNW-${date}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function toAddress(address: Stripe.Address | null | undefined): OrderAddress | null {
  if (!address) return null;
  return { line1: address.line1 ?? "", line2: address.line2 ?? "", city: address.city ?? "", state: address.state ?? "", postalCode: address.postal_code ?? "", country: address.country ?? "" };
}

/**
 * Records a paid Checkout Session as an order and decrements tracked stock.
 * Idempotent: the order document id is the Checkout Session id, so webhook retries are no-ops.
 */
export async function fulfilCheckoutSession(sessionId: string) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured.");
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return { status: "unpaid" as const };

  const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100, expand: ["data.price.product"] });
  const items = lineItems.data.map((line) => {
    const product = line.price?.product;
    const productId = product && typeof product === "object" && !("deleted" in product && product.deleted) ? product.metadata.productId ?? "" : "";
    const qty = line.quantity ?? 1;
    return { productId, name: line.description ?? "Item", unitCents: Math.round(line.amount_total / qty), qty };
  });

  const delivery: DeliveryMethod = session.metadata?.delivery === "pickup" ? "pickup" : "ship";
  const vehicle = session.custom_fields?.find((field) => field.key === "vehicle")?.text?.value ?? "";
  const shipping = session.collected_information?.shipping_details;
  const orderRef = ordersCollection().doc(session.id);

  const created = await db().runTransaction(async (tx) => {
    if ((await tx.get(orderRef)).exists) return false;
    const productRefs = [...new Set(items.map((item) => item.productId).filter(Boolean))].map((id) => productsCollection().doc(id));
    const productDocs = productRefs.length ? await tx.getAll(...productRefs) : [];
    const stockIssues: string[] = [];
    for (const doc of productDocs) {
      const stock = doc.get("stock");
      if (!doc.exists || !Number.isInteger(stock)) continue;
      const qty = items.filter((item) => item.productId === doc.id).reduce((sum, item) => sum + item.qty, 0);
      if (stock < qty) stockIssues.push(`${doc.get("name") ?? doc.id}: ordered ${qty}, only ${stock} in stock`);
      tx.update(doc.ref, { stock: Math.max(0, stock - qty), updatedAt: FieldValue.serverTimestamp() });
    }
    const createdAt = new Date((session.created ?? Date.now() / 1000) * 1000);
    tx.create(orderRef, {
      orderNumber: orderNumber(createdAt),
      status: "paid" satisfies OrderStatus,
      createdAt,
      items,
      subtotalCents: session.amount_subtotal ?? 0,
      shippingCents: session.total_details?.amount_shipping ?? 0,
      totalCents: session.amount_total ?? 0,
      delivery,
      customer: { name: shipping?.name ?? session.customer_details?.name ?? "", email: session.customer_details?.email ?? "", phone: session.customer_details?.phone ?? "" },
      shippingAddress: delivery === "ship" ? toAddress(shipping?.address) : null,
      vehicle,
      stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? ""),
      stockIssues,
      staffNote: "",
      trackingNumber: "",
      userId: session.metadata?.uid ?? "",
    });
    return true;
  });

  if (created) revalidateTag(PRODUCTS_TAG, { expire: 0 });
  return { status: created ? ("created" as const) : ("exists" as const) };
}

function toOrder(id: string, data: DocumentData): Order {
  return {
    id,
    orderNumber: String(data.orderNumber ?? id),
    status: orderStatuses.some((item) => item.value === data.status) ? data.status : "paid",
    createdAt: typeof data.createdAt?.toMillis === "function" ? data.createdAt.toMillis() : 0,
    items: Array.isArray(data.items) ? data.items : [],
    subtotalCents: data.subtotalCents ?? 0,
    shippingCents: data.shippingCents ?? 0,
    totalCents: data.totalCents ?? 0,
    delivery: data.delivery === "pickup" ? "pickup" : "ship",
    customer: { name: data.customer?.name ?? "", email: data.customer?.email ?? "", phone: data.customer?.phone ?? "" },
    shippingAddress: data.shippingAddress ?? null,
    vehicle: data.vehicle ?? "",
    stripePaymentIntentId: data.stripePaymentIntentId ?? "",
    stockIssues: Array.isArray(data.stockIssues) ? data.stockIssues : [],
    staffNote: data.staffNote ?? "",
    trackingNumber: data.trackingNumber ?? "",
    userId: data.userId ?? "",
  };
}

export async function listOrders(limit = 100) {
  const snapshot = await ordersCollection().orderBy("createdAt", "desc").limit(limit).get();
  return snapshot.docs.map((doc) => toOrder(doc.id, doc.data()));
}

/**
 * A customer's orders: everything placed while signed in, plus guest orders with the same email
 * once that email is verified (so nobody can see orders just by signing up with someone else's address).
 */
export async function listOrdersForUser(user: { uid: string; email: string; emailVerified: boolean }) {
  const [byUser, byEmail] = await Promise.all([
    ordersCollection().where("userId", "==", user.uid).limit(100).get(),
    user.emailVerified && user.email ? ordersCollection().where("customer.email", "==", user.email).limit(100).get() : null,
  ]);
  const orders = new Map<string, Order>();
  for (const doc of [...byUser.docs, ...(byEmail?.docs ?? [])]) orders.set(doc.id, toOrder(doc.id, doc.data()));
  return [...orders.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export async function getOrder(id: string) {
  const doc = await ordersCollection().doc(id).get();
  return doc.exists ? toOrder(doc.id, doc.data()!) : null;
}

export async function updateOrder(id: string, changes: Pick<Order, "status" | "staffNote" | "trackingNumber">) {
  await ordersCollection().doc(id).update({ ...changes, updatedAt: FieldValue.serverTimestamp() });
}
