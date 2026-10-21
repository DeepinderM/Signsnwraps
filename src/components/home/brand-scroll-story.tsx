"use client";

import { Car, Lightbulb, Printer, ShieldCheck, Signpost, Truck } from "lucide-react";
import { ScrollStory, type RevealItem } from "@/components/ui/text-scroll-animation";

// Lives in a client component because icon components can't be passed from a server page.
const services: RevealItem[] = [
  { label: "Signs", href: "/signs/signage", icon: Signpost },
  { label: "Print", href: "/signs/printing", icon: Printer },
  { label: "Neon", href: "/signs/neon", icon: Lightbulb },
  { label: "Wraps", href: "/wraps/vehicle-wraps", icon: Car },
  { label: "Colour PPF", href: "/wraps/ppf", icon: ShieldCheck },
  { label: "Fleet", href: "/wraps/fleet", icon: Truck },
];

export function BrandScrollStory() {
  return <ScrollStory eyebrow="THE SIGNSNWRAPS PROMISE" text={"Expert advice.\nBold results."} highlight="Bold results." caption="one studio for every surface" items={services} variant="rise" />;
}
