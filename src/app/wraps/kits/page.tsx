import type { Metadata } from "next";
import { KitShopPage } from "@/components/wraps/catalog-pages";
export const metadata: Metadata = { title: "Pre-Cut PPF Kits", description: "Find pre-cut paint protection film kit patterns by vehicle. Choose DIY or explore professional fitting at Laverton North.", alternates: { canonical: "/wraps/kits" } };
export default function Page(){return <KitShopPage/>;}
