import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminNav } from "../../admin-nav";
import { ProductForm } from "../product-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  const admin = await requireAdmin();
  return <><AdminNav email={admin.email} /><Link className="text-link" href="/admin/products">← Products</Link><h1>Add product</h1><ProductForm /></>;
}
