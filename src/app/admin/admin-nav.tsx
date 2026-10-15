"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { clientAuth, isFirebaseClientConfigured } from "@/lib/firebase/client";

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    if (isFirebaseClientConfigured) await signOut(clientAuth()).catch(() => undefined);
    router.replace("/admin/login");
    router.refresh();
  }
  return <nav className="admin-nav" aria-label="Store admin">
    <b>Store admin</b>
    {[["/admin/enquiries", "Enquiries"], ["/admin/orders", "Orders"], ["/admin/products", "Products"]].map(([href, label]) => <Link key={href} href={href} aria-current={pathname.startsWith(href) ? "page" : undefined}>{label}</Link>)}
    <span>{email}</span>
    <button type="button" onClick={logout}>Sign out</button>
  </nav>;
}
