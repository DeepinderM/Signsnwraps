import type { Metadata } from "next";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { AdminNav } from "../../admin-nav";
import { ProductForm } from "../product-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  const admin = await requireSuperAdmin();
  return <><AdminNav admin={{ email: admin.email, role: admin.role, store: admin.store }} /><Link className="text-link" href="/admin/products">← Products</Link><h1>Add product</h1><ProductForm /></>;
}
