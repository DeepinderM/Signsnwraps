import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSessionUser } from "@/lib/auth";
import { isFirebaseConfigured } from "@/lib/firebase/admin";
import { productsCollection, toProduct } from "@/lib/shop/products";
import { MAX_CART_LINES, MAX_LINE_QTY, shippingCents, FREE_SHIPPING_OVER_CENTS, type CartLine, type DeliveryMethod } from "@/lib/shop/catalog";

function parseBody(body: unknown): { lines: CartLine[]; delivery: DeliveryMethod } | null {
  if (!body || typeof body !== "object") return null;
  const { items, delivery } = body as { items?: unknown; delivery?: unknown };
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_CART_LINES || (delivery !== "ship" && delivery !== "pickup")) return null;
  const merged = new Map<string, number>();
  for (const item of items) {
    const { productId, qty } = (item ?? {}) as { productId?: unknown; qty?: unknown };
    if (typeof productId !== "string" || !/^[a-z0-9-]{1,120}$/.test(productId) || !Number.isInteger(qty) || (qty as number) < 1) return null;
    merged.set(productId, (merged.get(productId) ?? 0) + (qty as number));
  }
  if ([...merged.values()].some((qty) => qty > MAX_LINE_QTY)) return null;
  return { lines: [...merged].map(([productId, qty]) => ({ productId, qty })), delivery };
}

function siteOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  return request.headers.get("origin") ?? new URL(request.url).origin;
}

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe || !isFirebaseConfigured()) return NextResponse.json({ error: "Online checkout is not connected yet. Please call or email the studio to order." }, { status: 503 });

  // Prices are members-only, so checkout needs a signed-in account.
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please log in or create an account to check out." }, { status: 401 });

  const parsed = parseBody(await request.json().catch(() => null));
  if (!parsed) return NextResponse.json({ error: "Your cart could not be read. Please refresh the page and try again." }, { status: 400 });

  const docs = await productsCollection().firestore.getAll(...parsed.lines.map((line) => productsCollection().doc(line.productId)));
  const problems: string[] = [];
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  let subtotal = 0;
  const origin = siteOrigin(request);

  parsed.lines.forEach((line, index) => {
    const doc = docs[index];
    const product = doc.exists ? toProduct(doc.id, doc.data()!) : null;
    if (!product || !product.active || product.priceCents <= 0) return problems.push(`An item in your cart is no longer available.`);
    if (product.stock !== null && product.stock < line.qty) return problems.push(product.stock === 0 ? `${product.name} is out of stock.` : `Only ${product.stock} × ${product.name} left in stock.`);
    subtotal += product.priceCents * line.qty;
    lineItems.push({
      quantity: line.qty,
      price_data: {
        currency: "aud",
        unit_amount: product.priceCents,
        tax_behavior: "inclusive",
        product_data: { name: product.name, metadata: { productId: product.id, category: product.category }, ...(product.imageUrl?.startsWith("https://") ? { images: [product.imageUrl] } : {}) },
      },
    });
  });
  if (problems.length) return NextResponse.json({ error: problems.join(" "), problems }, { status: 409 });

  const shipping = shippingCents(subtotal, parsed.delivery);
  // Prefill the customer's email in Stripe and link the order to their account.
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "aud",
      line_items: lineItems,
      locale: "en",
      phone_number_collection: { enabled: true },
      billing_address_collection: "auto",
      ...(parsed.delivery === "ship" ? { shipping_address_collection: { allowed_countries: ["AU"] } } : {}),
      shipping_options: [{
        shipping_rate_data: parsed.delivery === "pickup"
          ? { display_name: "Click & collect · Laverton North", type: "fixed_amount", fixed_amount: { amount: 0, currency: "aud" }, tax_behavior: "inclusive" }
          : { display_name: shipping === 0 ? `Free standard shipping (orders over $${FREE_SHIPPING_OVER_CENTS / 100})` : "Standard shipping · Australia", type: "fixed_amount", fixed_amount: { amount: shipping, currency: "aud" }, tax_behavior: "inclusive", delivery_estimate: { minimum: { unit: "business_day", value: 3 }, maximum: { unit: "business_day", value: 8 } } },
      }],
      custom_fields: [{ key: "vehicle", label: { type: "custom", custom: "Vehicle make, model & year" }, type: "text", optional: true, text: { maximum_length: 120 } }],
      metadata: { delivery: parsed.delivery, source: "signsnwraps-web", uid: user.uid },
      ...(user.email ? { customer_email: user.email } : {}),
      payment_intent_data: { metadata: { delivery: parsed.delivery } },
      success_url: `${origin}/wraps/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/wraps/cart`,
    });
  } catch (error) {
    console.error("Stripe Checkout session failed", error);
    return NextResponse.json({ error: "Secure checkout is unavailable right now. Please try again shortly." }, { status: 502 });
  }

  if (!session.url) return NextResponse.json({ error: "Checkout could not be started. Please try again." }, { status: 502 });
  return NextResponse.json({ url: session.url });
}
