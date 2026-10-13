import type { Metadata } from "next";
import { InstallerJoinPage } from "@/components/wraps/catalog-pages";
export const metadata: Metadata={title:"Installer Program Information",description:"Learn about plans for the Signsnwraps PPF installer program. Applications will open after studio fitment training and standards are established.",alternates:{canonical:"/wraps/installers/join"}};
export default function Page(){return <InstallerJoinPage/>;}
