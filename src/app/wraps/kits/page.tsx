import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { KitShopPage } from "@/components/wraps/catalog-pages";
export const metadata: Metadata = pageMetadata({ title: "Pre-Cut Clear PPF Kits for Utes, 4WDs & Cars", description: "Pre-cut clear PPF kits for Toyota, Ford, Mazda, Isuzu, Mitsubishi, Nissan and Subaru. Fit it yourself; order online, shipped Australia-wide.", path: "/wraps/kits" });
export default function Page(){return <KitShopPage/>;}
