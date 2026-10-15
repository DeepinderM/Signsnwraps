import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = { title: { default: "Store admin", template: "%s | Store admin" }, robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-shell"><div className="container">{children}</div></div>;
}
