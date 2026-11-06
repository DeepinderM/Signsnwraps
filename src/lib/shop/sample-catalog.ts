import { colourFilms } from "@/lib/data/wraps";
import kitCatalogue from "@/lib/data/kit-catalogue.json";
import type { Product } from "./catalog";

// The shop catalogue loaded from the admin Products page:
// - PPF kits, bonnet strips, tailgates, PRO kits, universal pieces, replacement panels and tools from
//   src/lib/data/kit-catalogue.json (built by scripts/convert-kit-catalogue.py);
// - colour PPF sheets, still sample listings until real colour stock is set up.
export type CatalogueProduct = Omit<Product, "updatedAt"> & { source: "kit-catalogue" | "sample" };

export function buildSampleCatalog(): CatalogueProduct[] {
  const kits = (kitCatalogue.products as Omit<Product, "updatedAt">[]).map((product): CatalogueProduct => ({ ...product, source: "kit-catalogue" }));
  const colour = colourFilms.map((film, index): CatalogueProduct => ({
    id: `colour-${film.name.toLowerCase().replace(/\s+/g, "-")}-sheet`,
    name: `${film.name} colour PPF sheet · 1.52 m × 1 m`,
    category: "colour",
    description: `${film.finish} finish coloured protection film, supplied as a single sheet for accents and small panels.`,
    priceCents: 9500,
    imageUrl: null, images: [], options: [], variants: [], years: [],
    stock: 20,
    active: true,
    sample: true,
    sortOrder: 2000 + index,
    fitment: null,
    source: "sample",
  }));
  return [...kits, ...colour];
}
