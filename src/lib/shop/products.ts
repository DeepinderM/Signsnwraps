import "server-only";
import { unstable_cache } from "next/cache";
import type { DocumentData } from "firebase-admin/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase/admin";
import { isCategory, vehicleKitId, type Product, type ProductCategory } from "./catalog";

export const PRODUCTS_TAG = "products";
export const productsCollection = () => db().collection("products");

export function toProduct(id: string, data: DocumentData): Product {
  const fitment = data.fitment && typeof data.fitment === "object" ? { make: String(data.fitment.make ?? ""), model: String(data.fitment.model ?? ""), coverage: String(data.fitment.coverage ?? "") } : null;
  return {
    id,
    name: String(data.name ?? id),
    category: isCategory(data.category) ? data.category : "universal",
    description: String(data.description ?? ""),
    priceCents: Number.isInteger(data.priceCents) ? data.priceCents : 0,
    imageUrl: typeof data.imageUrl === "string" && data.imageUrl ? data.imageUrl : null,
    stock: Number.isInteger(data.stock) ? data.stock : null,
    active: data.active === true,
    sample: data.sample === true,
    sortOrder: Number.isFinite(data.sortOrder) ? data.sortOrder : 0,
    fitment,
    updatedAt: typeof data.updatedAt?.toMillis === "function" ? data.updatedAt.toMillis() : 0,
  };
}

const byOrder = (a: Product, b: Product) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);

/** Every product, uncached. Used by admin pages and checkout. */
export async function listAllProducts() {
  const snapshot = await productsCollection().get();
  return snapshot.docs.map((doc) => toProduct(doc.id, doc.data())).sort(byOrder);
}

const cachedProducts = unstable_cache(listAllProducts, ["shop-products"], { tags: [PRODUCTS_TAG], revalidate: 300 });

/** Active products for the storefront, or null when the store is not connected/reachable. */
export async function getStorefrontProducts(category?: ProductCategory): Promise<Product[] | null> {
  if (!isFirebaseConfigured()) return null;
  try {
    const products = await cachedProducts();
    return products.filter((product) => product.active && (!category || product.category === category));
  } catch (error) {
    console.error("Unable to load products", error);
    return null;
  }
}

export async function getStorefrontProduct(id: string) {
  const products = await getStorefrontProducts();
  return products ? (products.find((product) => product.id === id) ?? undefined) : null;
}

export async function getVehicleKits(make: string, model: string) {
  const products = await getStorefrontProducts("vehicle-kit");
  return products?.filter((product) => product.fitment?.make === make && product.fitment.model === model) ?? null;
}

export async function getVehicleKit(make: string, model: string, coverage: string) {
  return getStorefrontProduct(vehicleKitId(make, model, coverage));
}
