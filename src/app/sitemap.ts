import type { MetadataRoute } from "next";
import { services, industries, locations, projects } from "@/lib/data/content";
import { kitCoverage, kitCategories, vehicleMakes } from "@/lib/data/wraps";
const base = process.env.NEXT_PUBLIC_SITE_URL || "https://signsnwraps.com.au";
export default function sitemap(): MetadataRoute.Sitemap {
  const fixed = ["", "/signs", "/signs/book", "/signs/signage", "/signs/shopfronts", "/signs/printing", "/signs/neon", "/signs/projects", "/wraps", "/wraps/vehicle-wraps", "/wraps/ppf", "/wraps/kits", "/wraps/compare", "/wraps/how-to-install", "/wraps/film", "/wraps/installers", "/wraps/installers/join", "/wraps/book", "/wraps/faq", "/trade", "/shipping-returns", "/services", "/industries", "/work", "/expert-advice", "/book", "/quote", "/locations", "/about", "/contact"];
  const dynamic = [...services.map((x) => `/services/${x.slug}`), ...industries.map((x) => `/industries/${x.slug}`), ...locations.map((x) => `/locations/${x.slug}`), ...projects.map((x) => `/work/${x.slug}`)];
  const kitRoutes = [
    ...kitCategories.map((item) => `/wraps/kits/${item.slug}`),
    ...kitCoverage.map((item) => `/wraps/kits/${item.slug}`),
    ...vehicleMakes.flatMap((make) => make.models.flatMap((model) => [
      `/wraps/kits/${make.slug}/${model.slug}`,
      ...model.years.map((year) => `/wraps/kits/${make.slug}/${model.slug}-${year}`),
      ...model.years.flatMap((year) => kitCoverage.map((kit) => `/wraps/kits/${make.slug}/${model.slug}-${year}/${kit.slug}`)),
      ...kitCoverage.map((kit) => `/wraps/kits/${make.slug}/${model.slug}/${kit.slug}`),
    ])),
  ];
  return [...new Set([...fixed, ...dynamic, ...kitRoutes])].map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: "monthly", priority: path === "" ? 1 : path === "/wraps" || path === "/signs" ? 0.9 : 0.7 }));
}
