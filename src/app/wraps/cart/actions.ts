"use server";

import { findVariant, splitLineId } from "@/lib/shop/catalog";
import { getStorefrontProducts } from "@/lib/shop/products";
import { canSeePrices } from "@/lib/shop/price-access";

export type CartProductInfo = { name: string; priceCents: number; imageUrl: string | null; stock: number | null };

/** Current name, price and stock for the products in a browser cart. null = store unreachable. */
export async function refreshCartProducts(ids: string[]): Promise<Record<string, CartProductInfo> | null> {
  if (!await canSeePrices()) return null;
  const wanted = new Set(ids.slice(0, 50));
  const products = await getStorefrontProducts();
  if (!products) return null;
  const byId = new Map(products.map((product) => [product.id, product]));
  // Cart lines for a product option are "<id>~<option>": price and name come from that option.
  const entries = [...wanted].flatMap((lineKey) => {
    const { productId, variantKey } = splitLineId(lineKey);
    const product = byId.get(productId);
    const variant = product && variantKey ? findVariant(product, variantKey) : undefined;
    if (!product || (variantKey ? !variant : product.variants.length > 0)) return [];
    return [[lineKey, { name: variant ? `${product.name} · ${variant.label}` : product.name, priceCents: variant?.priceCents ?? product.priceCents, imageUrl: product.imageUrl, stock: product.stock }] as const];
  });
  return Object.fromEntries(entries);
}
