import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { InstallerDirectoryPage } from "@/components/wraps/catalog-pages";
export const metadata: Metadata = pageMetadata({ title: "Find a PPF Installer", description: "Looking for a paint protection film installer? Book professional PPF fitting at the Signsnwraps studio in Laverton North and learn about our installer network.", path: "/wraps/installers" });
export default function Page(){return <InstallerDirectoryPage/>;}
