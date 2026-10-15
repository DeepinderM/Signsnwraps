import { colourFilms, kitCoverage, vehicleMakes } from "@/lib/data/wraps";
import { vehicleKitId, type Product } from "./catalog";

// Placeholder listings so the store can be tested end to end. Every item is flagged `sample: true`;
// staff must confirm pattern fitment, pricing and stock before treating any of these as real.
type SampleProduct = Omit<Product, "updatedAt">;

const coveragePrice: Record<string, number> = { "front-protection": 18900, "full-front": 44900, "door-edges-cups": 7900, "sills-tailgate": 14900, headlights: 6900 };
const bodyFactor = { Car: 1, SUV: 1.1, Ute: 1.15, "4WD": 1.2 } as const;
const roundTo5Dollars = (cents: number) => Math.round(cents / 500) * 500;

export function buildSampleCatalog(): SampleProduct[] {
  const kits = vehicleMakes.flatMap((make) => make.models.flatMap((model) => kitCoverage.filter((coverage) => coverage.slug in coveragePrice).map((coverage, index): SampleProduct => ({
    id: vehicleKitId(make.slug, model.slug, coverage.slug),
    name: `${make.name} ${model.name} ${coverage.name.toLowerCase()} PPF kit`,
    category: "vehicle-kit",
    description: `${coverage.detail} Pre-cut for the ${make.name} ${model.name} (${model.years.at(-1)}–${model.years[0]}). Confirm year, trim and body variant before ordering.`,
    priceCents: roundTo5Dollars(coveragePrice[coverage.slug] * bodyFactor[model.body]),
    imageUrl: null,
    stock: null,
    active: true,
    sample: true,
    sortOrder: 100 + index,
    fitment: { make: make.slug, model: model.slug, coverage: coverage.slug },
  }))));

  const colour = colourFilms.map((film, index): SampleProduct => ({
    id: `colour-${film.name.toLowerCase().replace(/\s+/g, "-")}-sheet`,
    name: `${film.name} colour PPF sheet · 1.52 m × 1 m`,
    category: "colour",
    description: `${film.finish} finish coloured protection film, supplied as a single sheet for accents and small panels.`,
    priceCents: 9500,
    imageUrl: null,
    stock: 20,
    active: true,
    sample: true,
    sortOrder: 200 + index,
    fitment: null,
  }));

  const simple = (id: string, name: string, category: Product["category"], description: string, priceCents: number, stock: number | null, sortOrder: number): SampleProduct => ({ id, name, category, description, priceCents, imageUrl: null, stock, active: true, sample: true, sortOrder, fitment: null });

  return [
    ...kits,
    ...colour,
    simple("universal-door-cup-set", "Door cup protection set (4)", "universal", "Clear film pieces for the scratch-prone area behind door handles.", 2900, 50, 300),
    simple("universal-door-edge-guards", "Door edge guard strips", "universal", "Clear edge strips for four doors, trimmed to length.", 3500, 50, 301),
    simple("universal-boot-sill-strip", "Boot sill protection strip", "universal", "Protects the loading lip from bags, boxes and tools.", 3900, 40, 302),
    simple("universal-mirror-caps", "Mirror cap protection pair", "universal", "Universal pieces for mirror caps, trimmed during install.", 4900, 40, 303),
    simple("replacement-bonnet-piece", "Replacement bonnet piece", "replacement-panels", "A single replacement bonnet piece for an existing kit. Add your vehicle at checkout.", 8900, null, 400),
    simple("replacement-bumper-piece", "Replacement bumper piece", "replacement-panels", "A single replacement bumper piece for an existing kit. Add your vehicle at checkout.", 9900, null, 401),
    simple("replacement-mirror-piece", "Replacement mirror piece", "replacement-panels", "A single replacement mirror piece for an existing kit. Add your vehicle at checkout.", 2900, null, 402),
    simple("tools-install-kit", "PPF install kit", "tools", "Squeegees, spray bottles and a lint-free cloth for a DIY kit install.", 4900, 30, 500),
    simple("tools-felt-squeegee", "Felt-edge squeegee", "tools", "Soft-edge squeegee for working film without scratching.", 1200, 60, 501),
    simple("tools-slip-solution", "PPF slip solution · 1 L", "tools", "Ready-to-use slip solution for positioning film.", 1900, 40, 502),
    simple("tools-aftercare-spray", "PPF aftercare spray · 500 mL", "tools", "Gentle detailer for film-protected paint.", 2900, 40, 503),
  ];
}
