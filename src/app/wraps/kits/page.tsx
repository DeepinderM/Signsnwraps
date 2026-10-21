import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { KitShopPage } from "@/components/wraps/catalog-pages";
export const metadata: Metadata = pageMetadata({ title: "Pre-Cut Clear PPF Kits for Utes, 4WDs & Cars", description: "Find a pre-cut clear paint protection film kit for your Toyota, Ford, Mazda, Isuzu, Mitsubishi, Nissan or Subaru and fit it yourself. Order online, shipped Australia-wide.", path: "/wraps/kits" });
export default function Page(){return <KitShopPage/>;}
