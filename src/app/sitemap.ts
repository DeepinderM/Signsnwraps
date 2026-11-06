import type { MetadataRoute } from "next";
import { services, industries, locations, projects, serviceHomes } from "@/lib/data/content";
import { kitCoverage, kitCategories, vehicleMakes } from "@/lib/data/wraps";
import { getStorefrontProducts } from "@/lib/shop/products";
import { productHref } from "@/lib/shop/catalog";
import { absoluteUrl } from "@/lib/seo";

// Only canonical, indexable URLs: no year variants (they canonicalise to the model page),
// no redirected /services duplicates, no cart/checkout/admin.
export const revalidate = 3600;

const priority = (path: string) => path === "/" ? 1 : ["/signs", "/wraps"].includes(path) ? 0.9
  : /^\/(signs\/(signage|shopfronts|printing|neon|fleet)|wraps\/(vehicle-wraps|ppf|kits|shop|fleet))$/.test(path) ? 0.8
  : /^\/(book|quote|contact|locations\/)/.test(path) ? 0.7 : 0.6;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed = ["", "/signs", "/signs/signage", "/signs/shopfronts", "/signs/printing", "/signs/neon", "/signs/fleet", "/signs/projects", "/signs/book",
    "/wraps", "/wraps/vehicle-wraps", "/wraps/ppf", "/wraps/fleet", "/wraps/kits", "/wraps/shop", "/wraps/compare", "/wraps/how-to-install", "/wraps/installers", "/wraps/installers/join", "/wraps/book", "/wraps/faq",
    "/trade", "/shipping-returns", "/services", "/industries", "/work", "/expert-advice", "/book", "/quote", "/locations", "/about", "/contact"];
  const content = [
    ...services.filter((item) => !serviceHomes[item.slug]).map((item) => `/services/${item.slug}`),
    ...industries.map((item) => `/industries/${item.slug}`), ...locations.map((item) => `/locations/${item.slug}`), ...projects.map((item) => `/work/${item.slug}`),
  ];
  const kits = [
    ...kitCategories.map((item) => `/wraps/kits/${item.slug}`), ...kitCoverage.map((item) => `/wraps/kits/${item.slug}`),
    ...vehicleMakes.flatMap((make) => [`/wraps/kits/${make.slug}`, ...make.models.map((model) => `/wraps/kits/${make.slug}/${model.slug}`)]),
  ];
  // Every live product: vehicle kits under the kit finder, everything else on its shop page.
  const products = ((await getStorefrontProducts()) ?? []).map((product) => productHref(product));
  return [...new Set([...fixed.map((path) => path || "/"), ...content, ...kits, ...products])].map((path) => ({ url: absoluteUrl(path), changeFrequency: path.startsWith("/wraps/shop") || path.startsWith("/wraps/kits") ? "weekly" : "monthly", priority: priority(path) }));
}
