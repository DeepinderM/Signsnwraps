import Link from "next/link";
import { isStripeTestMode } from "@/lib/stripe";

/** Shown when products can't be loaded (Firebase not configured or unreachable). */
export function StoreUnavailable() {
  return <div className="shop-notice"><b>The online store is temporarily unavailable.</b><p>Please try again shortly, or contact the studio to order.</p><Link className="text-link" href="/wraps/book">Book an In-Store Consultation</Link></div>;
}

/** Makes Stripe test mode obvious so nobody mistakes a test order for a real one. */
export function TestModeBanner() {
  if (!isStripeTestMode()) return null;
  return <p className="shop-test-banner" role="note"><b>Test mode</b> · No real payments are taken. Use card 4242 4242 4242 4242, any future date and any CVC.</p>;
}
