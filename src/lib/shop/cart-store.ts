"use client";

import { useSyncExternalStore } from "react";
import { MAX_CART_LINES, MAX_LINE_QTY } from "./catalog";

// Browser-only cart. Prices here are a display snapshot; /api/checkout re-prices every line from Firestore.
export type CartItem = { productId: string; name: string; priceCents: number; imageUrl: string | null; href: string; qty: number; unavailable?: string };

const KEY = "snw-cart-v1";
const EMPTY: CartItem[] = [];
const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedItems: CartItem[] = EMPTY;

function read(): CartItem[] {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); } catch { return cachedItems; }
  if (raw === cachedRaw) return cachedItems;
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    cachedItems = Array.isArray(parsed) ? parsed.filter((item) => typeof item?.productId === "string" && Number.isInteger(item.qty) && item.qty > 0) : EMPTY;
  } catch { cachedItems = EMPTY; }
  return cachedItems;
}

function write(items: CartItem[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage unavailable; keep in memory */ cachedRaw = null; cachedItems = items; }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => { if (event.key === KEY) listener(); };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); };
}

export function useCart() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export const cart = {
  add(item: Omit<CartItem, "qty">, qty = 1) {
    const items = read();
    const existing = items.find((line) => line.productId === item.productId);
    if (!existing && items.length >= MAX_CART_LINES) return false;
    write(existing ? items.map((line) => line === existing ? { ...line, ...item, qty: Math.min(MAX_LINE_QTY, line.qty + qty) } : line) : [...items, { ...item, qty: Math.min(MAX_LINE_QTY, qty) }]);
    return true;
  },
  setQty(productId: string, qty: number) {
    write(read().map((line) => line.productId === productId ? { ...line, qty: Math.max(1, Math.min(MAX_LINE_QTY, qty)) } : line));
  },
  remove(productId: string) {
    write(read().filter((line) => line.productId !== productId));
  },
  snapshot() { return read(); },
  replace(items: CartItem[]) { write(items); },
  clear() { write([]); },
};
