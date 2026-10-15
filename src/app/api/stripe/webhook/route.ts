import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { fulfilCheckoutSession } from "@/lib/shop/orders";

// Stripe → Dashboard → Developers → Webhooks: send checkout.session.completed and
// checkout.session.async_payment_succeeded to https://<site>/api/stripe/webhook.
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!stripe || !secret) return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    try {
      await fulfilCheckoutSession(event.data.object.id);
    } catch (error) {
      console.error("Order fulfilment failed", event.data.object.id, error);
      return NextResponse.json({ error: "Fulfilment failed; Stripe will retry." }, { status: 500 });
    }
  }
  return NextResponse.json({ received: true });
}
