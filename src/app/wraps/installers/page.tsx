import type { Metadata } from "next";
import { InstallerDirectoryPage } from "@/components/wraps/catalog-pages";
export const metadata: Metadata={title:"Find a PPF Installer",description:"Learn about the developing Signsnwraps installer program or book professional PPF fitting at the Laverton North studio.",alternates:{canonical:"/wraps/installers"}};
export default function Page(){return <InstallerDirectoryPage/>;}
