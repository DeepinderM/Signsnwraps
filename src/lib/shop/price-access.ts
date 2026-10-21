import "server-only";
import { getSessionUser } from "@/lib/auth";
import type { Product } from "./catalog";

// Prices are members-only: visitors must sign in or create an account to see them.
// Pages strip prices on the server before anything reaches the browser (HTML, RSC payload, JSON-LD).

export async function canSeePrices() {
  return (await getSessionUser()) !== null;
}

/** Removes the price so it never leaves the server for a signed-out visitor. */
export function withoutPrice<T extends Pick<Product, "priceCents">>(product: T): T {
  return { ...product, priceCents: 0 };
}

export function loginForPricesHref(path: string) {
  return `/account/login?next=${encodeURIComponent(path)}`;
}
