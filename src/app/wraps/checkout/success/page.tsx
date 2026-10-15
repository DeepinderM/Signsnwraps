import type { Metadata } from "next";
import Link from "next/link";
import { ClearCartOnMount } from "@/components/shop/cart-view";
import { getStripe } from "@/lib/stripe";
import { formatAud } from "@/lib/shop/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Order confirmed", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ session_id?: string }> };

async function loadSession(sessionId: string | undefined) {
  const stripe = getStripe();
  if (!stripe || !sessionId?.startsWith("cs_")) return null;
  try {
    // Display only. Orders are recorded by the Stripe webhook (/api/stripe/webhook).
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return null;
  }
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const session = await loadSession((await searchParams).session_id);
  const paid = session?.payment_status === "paid";
  return <section className="cart-page"><div className="container">
    {paid && <ClearCartOnMount/>}
    <span className="eyebrow">WRAPS · ORDER {paid ? "CONFIRMED" : "RECEIVED"}</span>
    <h1 className="heading-xl">{paid ? <>Thank you.<br/>Your order is in.</> : <>We're checking<br/>your payment.</>}</h1>
    {session ? <p className="body-lg">{paid ? `We've received your payment of ${formatAud(session.amount_total ?? 0)}.` : "Your payment is still processing."} A receipt will be sent to <b>{session.customer_details?.email}</b>. {session.metadata?.delivery === "pickup" ? "We'll email you when your order is ready to collect from Laverton North." : "We'll email you when your order ships."}</p> : <p className="body-lg">We couldn't find this checkout. If you were charged, contact the studio and we'll help straight away.</p>}
    <div className="cart-actions"><Link className="button button-orange" href="/wraps/shop">Continue shopping</Link><Link className="button cart-outline" href="/wraps/how-to-install">Read the install guide</Link></div>
  </div></section>;
}
