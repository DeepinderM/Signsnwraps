"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { JsonLd } from "./json-ld";
import { breadcrumbLd } from "@/lib/seo";
import { industries, locations, projects, services } from "@/lib/data/content";
import { getVehicleSelection, kitCategories, kitCoverage } from "@/lib/data/wraps";

// Visible breadcrumb trail + BreadcrumbList structured data, derived from the URL.
const labels: Record<string, string> = {
  signs: "Signs & Print", wraps: "Wraps & PPF", signage: "Commercial Signage", shopfronts: "Shopfronts", printing: "Printing", neon: "Neon Signs",
  projects: "Projects", book: "Book a Consultation", "vehicle-wraps": "Vehicle Wraps", ppf: "Colour PPF", kits: "PPF Kits", shop: "Shop",
  compare: "Compare Fitting Options", "how-to-install": "How to Install PPF", installers: "Installers", join: "Become an Installer", faq: "FAQs",
  trade: "Trade", "shipping-returns": "Shipping & Returns", services: "Services", industries: "Industries", work: "Our Work",
  "expert-advice": "Expert Advice", quote: "Get a Quote", locations: "Locations", about: "About", contact: "Contact",
  account: "My Account", login: "Sign In",
  privacy: "Privacy Policy", terms: "Terms of Use", warranty: "Warranty", disclaimer: "Disclaimer",
};
const titleCase = (slug: string) => slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
const HIDDEN = [/^\/$/, /^\/admin/, /^\/wraps\/cart/, /^\/wraps\/checkout/, /^\/billing\//];

export function crumbsFor(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = [{ name: "Home", path: "/" }];
  for (let index = 0; index < parts.length; index += 1) {
    const segment = parts[index]; const path = `/${parts.slice(0, index + 1).join("/")}`; const parent = parts[index - 1];
    if (segment === "legal") continue; // no /legal index page
    if (parent === "kits" && index === 2) {
      const category = kitCategories.find((item) => item.slug === segment) ?? kitCoverage.find((item) => item.slug === segment);
      if (category) { crumbs.push({ name: "title" in category ? category.title : category.name, path }); continue; }
      const vehicle = parts[3] ? getVehicleSelection(segment, parts[3]) : undefined;
      if (!vehicle) { crumbs.push({ name: titleCase(segment), path }); continue; }
      crumbs.push({ name: `${vehicle.make.name} ${vehicle.model.name}${vehicle.year ? ` ${vehicle.year}` : ""}`, path: `${path}/${parts[3]}` });
      index += 1; // make + model collapse into one crumb (there is no make-only page)
      continue;
    }
    if (parts[1] === "kits" && index === 4) { crumbs.push({ name: kitCoverage.find((item) => item.slug === segment)?.name ?? titleCase(segment), path }); continue; }
    const name = segment === "fleet" ? (parent === "signs" ? "Fleet Signage" : "Fleet Wraps")
      : parent === "services" ? services.find((item) => item.slug === segment)?.title
      : parent === "industries" ? industries.find((item) => item.slug === segment)?.title
      : parent === "work" ? projects.find((item) => item.slug === segment)?.title
      : parent === "locations" ? locations.find((item) => item.slug === segment)?.name
      : parent === "signs" && labels[segment] === undefined ? titleCase(segment)
      : labels[segment];
    crumbs.push({ name: name ?? titleCase(segment), path });
  }
  return crumbs;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  if (HIDDEN.some((pattern) => pattern.test(pathname))) return null;
  const crumbs = crumbsFor(pathname);
  return <nav className="crumbs" aria-label="Breadcrumb">
    <JsonLd data={breadcrumbLd(crumbs)} />
    <ol className="container">{crumbs.map((crumb, index) => <li key={crumb.path}>{index === crumbs.length - 1 ? <span aria-current="page">{crumb.name}</span> : <Link href={crumb.path}>{crumb.name}</Link>}</li>)}</ol>
  </nav>;
}
