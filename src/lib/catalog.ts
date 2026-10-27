import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";
import odooSeed from "@/lib/data/catalog-seed.json";
import extraSeed from "@/lib/data/catalog-extra.json";
import { DEFAULT_ROLL_WIDTH_MM, type CatalogItem, type CatalogOption } from "@/lib/catalog-types";

// Quote/invoice product catalog (Firestore `catalog`), first loaded from the Odoo export
// (docs/finalproduct-oddo.xlsx → scripts/convert-odoo-catalog.py → src/lib/data/catalog-seed.json),
// plus products that aren't in Odoo yet (src/lib/data/catalog-extra.json, kept separate so re-converting doesn't drop them).
// Prices are ex GST, like every price entered on quotes and invoices. Super admins maintain it at /admin/catalog;
// every store uses it from the "Add from catalog" picker in the quote/invoice editor.

const catalog = () => db().collection("catalog");
const seed = [...odooSeed, ...extraSeed];

function toItem(id: string, data: FirebaseFirestore.DocumentData): CatalogItem {
  return {
    id, name: data.name ?? "", category: data.category ?? "Other", subcategory: data.subcategory ?? "", priceCents: data.priceCents ?? 0, unit: data.unit ?? "each",
    description: data.description ?? "", options: Array.isArray(data.options) ? data.options : [], active: data.active !== false, source: data.source ?? "manual",
    // "area-longest-side" was the first (superseded) vinyl rule; those products now use roll pricing.
    pricing: data.pricing === "roll" || data.pricing === "area-longest-side" ? "roll" : "fixed",
    rollWidthMm: Number(data.rollWidthMm) > 0 ? Number(data.rollWidthMm) : DEFAULT_ROLL_WIDTH_MM,
    code: data.code ?? "", production: data.production ?? "",
  };
}

/** All catalog items, sorted by category then name. */
export async function listCatalog({ activeOnly = false } = {}) {
  const snapshot = await catalog().get();
  return snapshot.docs.map((doc) => toItem(doc.id, doc.data())).filter((item) => !activeOnly || item.active)
    .sort((a, b) => a.category.localeCompare(b.category) || a.subcategory.localeCompare(b.subcategory) || a.name.localeCompare(b.name, "en", { numeric: true }));
}

export async function getCatalogItem(id: string) {
  if (!/^[a-z0-9-]{1,100}$/.test(id)) return null;
  const doc = await catalog().doc(id).get();
  return doc.exists ? toItem(doc.id, doc.data()!) : null;
}

export async function saveCatalogItem(item: Omit<CatalogItem, "source"> & { source?: string }, by: string) {
  await catalog().doc(item.id).set({ ...item, source: item.source ?? "manual", updatedBy: by, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

export async function setCatalogItemActive(id: string, active: boolean, by: string) {
  await catalog().doc(id).update({ active, updatedBy: by, updatedAt: FieldValue.serverTimestamp() });
}

/**
 * Loads the Odoo catalog. New products are added; with `updateExisting`, existing Odoo products get the
 * file's name, category, price and options (a product hidden by staff stays hidden). Manual products are untouched.
 */
export async function importSeedCatalog(by: string, { updateExisting = false } = {}) {
  const existing = new Map((await catalog().get()).docs.map((doc) => [doc.id, doc.data()]));
  let added = 0, updated = 0, grouped = 0, retired = 0;
  const items = seed as { id: string; name: string; category: string; subcategory?: string; priceCents: number; unit: string; pricing?: string; rollWidthMm?: number; code?: string; production?: string; active?: boolean; options: CatalogOption[] }[];
  for (let index = 0; index < items.length; index += 400) {
    const batch = db().batch();
    for (const item of items.slice(index, index + 400)) {
      const current = existing.get(item.id);
      if (current && !updateExisting) {
        // Without "update existing", only fill in a missing sub-category; prices and options stay as staff left them.
        if (item.subcategory && !current.subcategory) { batch.update(catalog().doc(item.id), { subcategory: item.subcategory }); grouped += 1; }
        continue;
      }
      batch.set(catalog().doc(item.id), { ...item, pricing: item.pricing ?? "fixed", subcategory: item.subcategory ?? current?.subcategory ?? "", description: current?.description ?? "", active: current ? current.active !== false : item.active !== false, source: "odoo", updatedBy: by, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      if (current) updated += 1; else added += 1;
    }
    await batch.commit();
  }
  // Products imported from Odoo before but no longer in the files (e.g. merged into a product with a
  // Quantity option) are hidden, not deleted, so quotes that used them keep working.
  const inSeed = new Set(items.map((item) => item.id));
  const stale = [...existing].filter(([id, data]) => data.source === "odoo" && data.active !== false && !inSeed.has(id));
  for (let index = 0; index < stale.length; index += 400) {
    const batch = db().batch();
    for (const [id] of stale.slice(index, index + 400)) batch.update(catalog().doc(id), { active: false, updatedBy: by, updatedAt: FieldValue.serverTimestamp() });
    await batch.commit();
  }
  retired = stale.length;
  return { added, updated, grouped, retired, total: items.length };
}

export const seedCatalogSize = (seed as unknown[]).length;
