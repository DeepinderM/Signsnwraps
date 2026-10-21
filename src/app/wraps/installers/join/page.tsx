import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { InstallerJoinPage } from "@/components/wraps/catalog-pages";
export const metadata: Metadata = pageMetadata({ title: "Become a PPF & Wrap Installer", description: "Apply to join the Signsnwraps installer network in Melbourne, South Australia or New South Wales. Fit pre-cut PPF kits and receive customer referrals.", path: "/wraps/installers/join" });
export default function Page(){return <InstallerJoinPage/>;}
