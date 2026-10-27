"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { clientAuth, isFirebaseClientConfigured } from "@/lib/firebase/client";
import type { Admin } from "@/lib/admin-auth";
import { serviceRegions } from "@/lib/data/content";

const superLinks = [["/admin/enquiries", "Enquiries"], ["/admin/billing", "Quotes & invoices"], ["/admin/catalog", "Catalog"], ["/admin/reports", "Sales"], ["/admin/orders", "Orders"], ["/admin/products", "Products"], ["/admin/users", "Users"], ["/admin/staff", "Staff"]];
const storeLinks = [["/admin/enquiries", "Enquiries"], ["/admin/billing", "Quotes & invoices"], ["/admin/catalog", "Catalog"], ["/admin/reports", "Sales"]];

export function AdminNav({ admin }: { admin: Pick<Admin, "email" | "role" | "store"> }) {
  const pathname = usePathname();
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    if (isFirebaseClientConfigured) await signOut(clientAuth()).catch(() => undefined);
    router.replace("/admin/login");
    router.refresh();
  }
  const store = serviceRegions.find((region) => region.value === admin.store)?.label;
  return <nav className="admin-nav" aria-label="Store admin">
    <b>{admin.role === "super" ? "Super admin" : `${store} store`}</b>
    {(admin.role === "super" ? superLinks : storeLinks).map(([href, label]) => <Link key={href} href={href} aria-current={pathname.startsWith(href) ? "page" : undefined}>{label}</Link>)}
    <span>{admin.email}</span>
    <button type="button" onClick={logout}>Sign out</button>
  </nav>;
}
