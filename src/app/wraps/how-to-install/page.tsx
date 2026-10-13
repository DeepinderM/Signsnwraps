import type { Metadata } from "next";
import { InstallGuidePage } from "@/components/wraps/catalog-pages";
export const metadata: Metadata={title:"PPF Kit Installation Guides",description:"Preparation and installation guidance for DIY PPF kits. Always follow the vehicle- and kit-specific instructions supplied with your product.",alternates:{canonical:"/wraps/how-to-install"}};
export default function Page(){return <InstallGuidePage/>;}
