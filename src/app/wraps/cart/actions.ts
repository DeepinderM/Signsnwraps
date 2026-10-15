"use server";

import { getStorefrontProducts } from "@/lib/shop/products";

export type CartProductInfo = { name: string; priceCents: number; imageUrl: string | null; stock: number | null };

/** Current name, price and stock for the products in a browser cart. null = store unreachable. */
export async function refreshCartProducts(ids: string[]): Promise<Record<string, CartProductInfo> | null> {
  const wanted = new Set(ids.slice(0, 50));
  const products = await getStorefrontProducts();
  if (!products) return null;
  return Object.fromEntries(products.filter((product) => wanted.has(product.id)).map((product) => [product.id, { name: product.name, priceCents: product.priceCents, imageUrl: product.imageUrl, stock: product.stock }]));
}
