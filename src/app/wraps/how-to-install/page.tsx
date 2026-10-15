import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { InstallGuidePage } from "@/components/wraps/catalog-pages";
export const metadata: Metadata = pageMetadata({ title: "How to Install a PPF Kit: Step-by-Step", description: "How to install a pre-cut PPF kit: prepare the panel, test fit, apply with slip solution, squeegee out and look after it while it cures. Tips from Signsnwraps.", path: "/wraps/how-to-install" });
export default function Page(){return <InstallGuidePage/>;}
