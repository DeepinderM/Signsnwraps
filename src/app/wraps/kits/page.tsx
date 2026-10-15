import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { KitShopPage } from "@/components/wraps/catalog-pages";
export const metadata: Metadata = pageMetadata({ title: "Pre-Cut PPF Kits for Utes, 4WDs & Cars", description: "Find a pre-cut paint protection film kit for your Toyota, Ford, Mazda, Isuzu, Mitsubishi, Nissan or Subaru. Order online or book a studio fit in Melbourne.", path: "/wraps/kits" });
export default function Page(){return <KitShopPage/>;}
