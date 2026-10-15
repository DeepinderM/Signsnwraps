// Shared, client-safe shop types and pricing rules. Firestore and Stripe access lives in server-only modules.

export const productCategories = [
  { slug: "vehicle-kit", name: "Vehicle PPF kits", detail: "Pre-cut paint protection film kits matched to a vehicle and coverage area." },
  { slug: "colour", name: "Colour PPF", detail: "Coloured protection film sheets for panels, accents and details." },
  { slug: "universal", name: "Universal protection", detail: "Protection pieces for common contact points across most vehicles." },
  { slug: "replacement-panels", name: "Replacement panels", detail: "Single pieces to refresh or repair part of a kit." },
  { slug: "tools", name: "Tools & care", detail: "Application essentials and aftercare." },
] as const;

export type ProductCategory = (typeof productCategories)[number]["slug"];

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  priceCents: number;
  imageUrl: string | null;
  /** null = made to order / not stock-tracked. */
  stock: number | null;
  active: boolean;
  /** Seeded placeholder listing; shown with a "sample" label until staff confirm it. */
  sample: boolean;
  sortOrder: number;
  fitment: { make: string; model: string; coverage: string } | null;
  updatedAt: number;
};

export type DeliveryMethod = "ship" | "pickup";

export type CartLine = { productId: string; qty: number };

export const SHIPPING_FLAT_CENTS = 1500;
export const FREE_SHIPPING_OVER_CENTS = 25000;
export const MAX_LINE_QTY = 10;
export const MAX_CART_LINES = 25;

export function shippingCents(subtotalCents: number, delivery: DeliveryMethod) {
  if (delivery === "pickup" || subtotalCents >= FREE_SHIPPING_OVER_CENTS) return 0;
  return SHIPPING_FLAT_CENTS;
}

export function formatAud(cents: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100);
}

export function isCategory(value: unknown): value is ProductCategory {
  return productCategories.some((item) => item.slug === value);
}

export function categoryName(slug: string) {
  return productCategories.find((item) => item.slug === slug)?.name ?? slug;
}

export function vehicleKitId(make: string, model: string, coverage: string) {
  return `kit-${make}-${model}-${coverage}`;
}

/** Canonical product URL. Vehicle kits live on the kit finder (/wraps/kits/make/model/coverage) so each kit has one URL. */
export function productHref(product: Pick<Product, "id"> & { fitment?: Product["fitment"] }) {
  const fit = product.fitment;
  return fit?.make && fit.model && fit.coverage ? `/wraps/kits/${fit.make}/${fit.model}/${fit.coverage}` : `/wraps/shop/${product.id}`;
}

export function inStock(product: Pick<Product, "stock" | "active">, qty = 1) {
  return product.active && (product.stock === null || product.stock >= qty);
}

export type OrderStatus = "paid" | "processing" | "ready_for_pickup" | "shipped" | "completed" | "cancelled" | "refunded";

export const orderStatuses: { value: OrderStatus; label: string }[] = [
  { value: "paid", label: "Paid · new" },
  { value: "processing", label: "Processing" },
  { value: "ready_for_pickup", label: "Ready for pickup" },
  { value: "shipped", label: "Shipped" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

export type OrderAddress = { line1: string; line2: string; city: string; state: string; postalCode: string; country: string };

export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: number;
  items: { productId: string; name: string; unitCents: number; qty: number }[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  delivery: DeliveryMethod;
  customer: { name: string; email: string; phone: string };
  shippingAddress: OrderAddress | null;
  vehicle: string;
  stripePaymentIntentId: string;
  stockIssues: string[];
  staffNote: string;
  trackingNumber: string;
  /** Firebase Auth uid when the order was placed while signed in. */
  userId: string;
};
