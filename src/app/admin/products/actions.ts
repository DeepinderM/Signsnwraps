"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { getDownloadURL } from "firebase-admin/storage";
import { requireAdmin } from "@/lib/admin-auth";
import { bucket, db } from "@/lib/firebase/admin";
import { PRODUCTS_TAG, productsCollection } from "@/lib/shop/products";
import { buildSampleCatalog } from "@/lib/shop/sample-catalog";
import { isCategory } from "@/lib/shop/catalog";

export type ProductFormState = { error?: string };

const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);

async function uploadImage(productId: string, file: File) {
  const ext = IMAGE_TYPES[file.type];
  const object = bucket().file(`products/${productId}/${Date.now()}.${ext}`);
  await object.save(Buffer.from(await file.arrayBuffer()), { contentType: file.type, resumable: false, metadata: { cacheControl: "public, max-age=31536000, immutable" } });
  return getDownloadURL(object);
}

export async function saveProduct(_previous: ProductFormState, form: FormData): Promise<ProductFormState> {
  await requireAdmin();
  const isNew = form.get("isNew") === "1";
  const id = isNew ? slugify(text(form, "id") || text(form, "name")) : text(form, "id");
  const name = text(form, "name");
  const category = text(form, "category");
  const description = text(form, "description");
  const price = Number(text(form, "price"));
  const stockText = text(form, "stock");
  const stock = stockText === "" ? null : Number(stockText);
  const sortOrder = Number(text(form, "sortOrder") || "0");
  const fitment = { make: text(form, "make"), model: text(form, "model"), coverage: text(form, "coverage") };
  const image = form.get("image");

  if (!/^[a-z0-9-]{1,120}$/.test(id)) return { error: "Product ID can only use lowercase letters, numbers and dashes." };
  if (!name || name.length > 140) return { error: "Enter a product name (up to 140 characters)." };
  if (!isCategory(category)) return { error: "Choose a category." };
  if (description.length > 2000) return { error: "Description is too long (2000 characters max)." };
  if (!Number.isFinite(price) || price < 0.5 || price > 50000) return { error: "Enter a price between $0.50 and $50,000." };
  if (stock !== null && (!Number.isInteger(stock) || stock < 0)) return { error: "Stock must be a whole number, or blank for made-to-order." };
  if (!Number.isFinite(sortOrder)) return { error: "Sort order must be a number." };
  if (category === "vehicle-kit" && (!fitment.make || !fitment.model || !fitment.coverage)) return { error: "Vehicle kits need a make, model and coverage so they show on the kit finder." };
  const hasImage = image instanceof File && image.size > 0;
  if (hasImage && (!IMAGE_TYPES[image.type] || image.size > 4 * 1024 * 1024)) return { error: "Images must be JPG, PNG or WebP, up to 4 MB." };

  const ref = productsCollection().doc(id);
  const data: Record<string, unknown> = {
    name, category, description,
    priceCents: Math.round(price * 100),
    stock, sortOrder,
    active: form.get("active") === "on",
    sample: form.get("sample") === "on",
    fitment: category === "vehicle-kit" ? fitment : null,
    updatedAt: FieldValue.serverTimestamp(),
  };
  try {
    if (hasImage) data.imageUrl = await uploadImage(id, image);
    else if (form.get("removeImage") === "on") data.imageUrl = null;
    if (isNew) await ref.create({ imageUrl: null, ...data, createdAt: FieldValue.serverTimestamp() });
    else await ref.update(data);
  } catch (error) {
    if ((error as { code?: number }).code === 6) return { error: `A product with ID "${id}" already exists.` };
    console.error("Saving product failed", error);
    return { error: "The product could not be saved. Please try again." };
  }
  updateTag(PRODUCTS_TAG);
  redirect(`/admin/products?saved=${encodeURIComponent(id)}`);
}

export async function deleteProduct(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  if (!/^[a-z0-9-]{1,120}$/.test(id)) return;
  await productsCollection().doc(id).delete();
  updateTag(PRODUCTS_TAG);
  redirect("/admin/products");
}

export async function setProductActive(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  if (!/^[a-z0-9-]{1,120}$/.test(id)) return;
  await productsCollection().doc(id).update({ active: form.get("active") === "1", updatedAt: FieldValue.serverTimestamp() });
  updateTag(PRODUCTS_TAG);
}

/** Adds the placeholder catalogue. Never overwrites a product that already exists. */
export async function loadSampleCatalog() {
  await requireAdmin();
  const products = buildSampleCatalog();
  const existing = new Set((await productsCollection().select().get()).docs.map((doc) => doc.id));
  const writer = db().bulkWriter();
  for (const product of products) {
    if (existing.has(product.id)) continue;
    const { id, ...data } = product;
    writer.create(productsCollection().doc(id), { ...data, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  }
  await writer.close();
  updateTag(PRODUCTS_TAG);
  redirect("/admin/products");
}
