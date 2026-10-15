import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { InstallerJoinPage } from "@/components/wraps/catalog-pages";
export const metadata: Metadata = pageMetadata({ title: "Become a PPF Installer", description: "Interested in fitting Signsnwraps pre-cut PPF kits? Learn about the planned installer program, training and standards, and register your interest by email.", path: "/wraps/installers/join" });
export default function Page(){return <InstallerJoinPage/>;}
