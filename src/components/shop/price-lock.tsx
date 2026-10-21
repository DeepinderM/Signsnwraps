import Link from "next/link";
import { Lock } from "lucide-react";
import { loginForPricesHref } from "@/lib/shop/price-access";

/** Shown in place of a price (and the add-to-cart button) for signed-out visitors. */
export function PriceLock({ path, compact = false }: { path: string; compact?: boolean }) {
  return <Link href={loginForPricesHref(path)} className={`price-lock${compact ? " price-lock-compact" : ""}`}>
    <Lock aria-hidden strokeWidth={2.2} />
    <span><b>Log in to see price</b>{!compact && <small>Sign in or create a free account to view prices and order.</small>}</span>
  </Link>;
}
