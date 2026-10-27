"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { getCatalogItem, importSeedCatalog, saveCatalogItem, setCatalogItemActive } from "@/lib/catalog";
import type { CatalogOption } from "@/lib/catalog-types";

export type CatalogResult = { ok?: string; error?: string } | null;

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

export async function importCatalog(_: CatalogResult, form: FormData): Promise<CatalogResult> {
  const admin = await requireSuperAdmin();
  const result = await importSeedCatalog(admin.email, { updateExisting: form.get("updateExisting") === "on" });
  refresh();
  return { ok: `Imported from the Odoo files: ${result.added} added, ${result.updated} updated${result.grouped ? `, ${result.grouped} sorted into sub-categories` : ""}${result.retired ? `, ${result.retired} old products hidden (no longer in the files)` : ""} (${result.total} products in the files).` };
}

function parseOptions(raw: string): CatalogOption[] | null {
  try {
    const options = JSON.parse(raw) as unknown;
    if (!Array.isArray(options) || options.length > 6) return null;
    const parsed = options.map((option) => {
      const { name, values } = (option ?? {}) as { name?: unknown; values?: unknown };
      if (typeof name !== "string" || !name.trim() || name.length > 60 || !Array.isArray(values) || values.length === 0 || values.length > 40) return null;
      const cleaned = values.map((value) => {
        const { label, extraCents } = (value ?? {}) as { label?: unknown; extraCents?: unknown };
        return typeof label === "string" && label.trim() && label.length <= 120 && Number.isInteger(extraCents) && Math.abs(extraCents as number) <= 10_000_000 ? { label: label.trim(), extraCents: extraCents as number } : null;
      });
      return cleaned.every(Boolean) ? { name: name.trim(), values: cleaned as CatalogOption["values"] } : null;
    });
    return parsed.every(Boolean) ? (parsed as CatalogOption[]) : null;
  } catch {
    return null;
  }
}

export async function saveProduct(_: CatalogResult, form: FormData): Promise<CatalogResult> {
  const admin = await requireSuperAdmin();
  const existingId = String(form.get("id") ?? "");
  const name = String(form.get("name") ?? "").trim().slice(0, 160);
  const category = String(form.get("category") ?? "").trim().slice(0, 60) || "Other";
  const subcategory = String(form.get("subcategory") ?? "").trim().slice(0, 60);
  const pricing = form.get("pricing") === "roll" ? "roll" : "fixed";
  const code = String(form.get("code") ?? "").trim().toUpperCase().replace(/[^A-Z0-9._/-]+/g, "").slice(0, 80);
  const production = String(form.get("production") ?? "").trim().slice(0, 2000);
  const rollWidthMm = Math.round(Number(form.get("rollWidthMm") ?? 1500));
  if (pricing === "roll" && !(rollWidthMm >= 100 && rollWidthMm <= 5000)) return { error: "Enter the roll width in mm (100–5000)." };
  const price = Number(String(form.get("price") ?? "").replace(/[$,\s]/g, ""));
  const options = parseOptions(String(form.get("options") ?? "[]"));
  if (!name) return { error: "Add a product name." };
  if (!Number.isFinite(price) || price < 0 || price > 100000) return { error: "Enter a price (ex GST)." };
  if (!options) return { error: "Each option needs a name and at least one value." };
  const existing = existingId ? await getCatalogItem(existingId) : null;
  if (existingId && !existing) return { error: "Product not found." };
  const id = existing?.id ?? slug(name);
  if (!id) return { error: "Use letters or numbers in the name." };
  if (!existing && (await getCatalogItem(id))) return { error: "A product with this name already exists." };
  await saveCatalogItem({ id, name, category, subcategory, pricing, code, production, rollWidthMm: pricing === "roll" ? rollWidthMm : 1500, priceCents: Math.round(price * 100), unit: String(form.get("unit") ?? "each").trim().slice(0, 30) || "each", description: String(form.get("description") ?? "").trim().slice(0, 1000), options, active: form.get("active") === "on", source: existing?.source }, admin.email);
  if (!existing) redirect(`/admin/catalog?saved=${encodeURIComponent(name)}`);
  refresh();
  return { ok: "Saved. New quotes and invoices use the new details; existing ones keep their prices." };
}

export async function toggleProduct(form: FormData) {
  const admin = await requireSuperAdmin();
  const item = await getCatalogItem(String(form.get("id") ?? ""));
  if (!item) return;
  await setCatalogItemActive(item.id, !item.active, admin.email);
  refresh();
}
