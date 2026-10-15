import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin-auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage() {
  if (await getAdmin()) redirect("/admin/orders");
  return <section className="admin-login"><span className="eyebrow">SIGNSNWRAPS · STAFF</span><h1>Store admin</h1><p>Sign in with your staff Google account to manage products and orders.</p><LoginForm /></section>;
}
