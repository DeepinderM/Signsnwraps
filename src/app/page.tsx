import type { Metadata } from "next";
import { HomeChooser } from "@/components/home/home-chooser";
export const metadata: Metadata = { title: "Make Your Brand Stand Out", description: "Choose your Signsnwraps experience: commercial signs and print, or vehicle wraps, PPF and pre-cut DIY protection kits.", alternates: { canonical: "/" } };
export default function HomePage() { return <HomeChooser />; }
