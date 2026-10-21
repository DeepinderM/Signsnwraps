import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { productsCollection, toProduct } from "@/lib/shop/products";
import { AdminNav } from "../../admin-nav";
import { ProductForm } from "../product-form";
import { DeleteProductButton } from "./delete-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireSuperAdmin();
  const { id } = await params;
  const doc = await productsCollection().doc(id).get();
  if (!doc.exists) notFound();
  const product = toProduct(doc.id, doc.data()!);
  return <><AdminNav admin={{ email: admin.email, role: admin.role, store: admin.store }} /><Link className="text-link" href="/admin/products">← Products</Link><h1>{product.name}</h1><ProductForm product={product} /><DeleteProductButton id={product.id} /></>;
}
