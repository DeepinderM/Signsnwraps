import kitCatalogue from "./kit-catalogue.json";

export type VehicleBody = "Ute" | "4WD" | "SUV" | "Car";
/** years is empty when kits for the model aren't split by year. */
export type VehicleModel = { slug: string; name: string; body: VehicleBody; years: number[]; image?: string | null; kits?: number };
/** logo: transparent brand logo for the "shop by car brand" grid, null when we don't have one. */
export type VehicleMake = { slug: string; name: string; logo?: string | null; models: VehicleModel[] };

// Every make and model we stock kits for, built from the kit catalogue (scripts/convert-kit-catalogue.py).
export const vehicleMakes: VehicleMake[] = kitCatalogue.makes as VehicleMake[];

/** Kit types, matched on the start of each kit's fitment.coverage slug (e.g. "ppf-kit-dual-cab-2024-current"). */
export const kitCoverage = [
  { slug: "ppf-kits", prefix: "ppf-kit", name: "Full PPF kits", detail: "Pre-cut film for the panels that take the most damage, fitted at home or in the studio." },
  { slug: "pro-kits", prefix: "pro-ppf-kit", name: "PRO kits", detail: "Wider studio-grade coverage with edges planned for a near-invisible finish." },
  { slug: "roof-kits", prefix: "pro-roof-kit", name: "PRO roof kits", detail: "Roof protection cut around aerials and light bars." },
  { slug: "bonnet-strips", prefix: "bonnet-strip", name: "Bonnet strips", detail: "Leading-edge protection for the bonnet, where stone chips hit first." },
  { slug: "tailgate-kits", prefix: "tailgate-kit", name: "Tailgate kits", detail: "Protection for the tailgate and loading area." },
  { slug: "door-cup-kits", prefix: "door-cup-kit", name: "Door cup kits", detail: "Clear film for the scratch-prone area behind the door handles." },
];
export const coverageOf = (coverageSlug: string) => kitCoverage.find((item) => coverageSlug.startsWith(`${item.prefix}-`) || coverageSlug === item.prefix);

export const colourFilms = [
  { name: "Gloss Black", hex: "#101010", finish: "Gloss" },
  { name: "Satin Black", hex: "#282828", finish: "Satin" },
  { name: "Gloss White", hex: "#f4f4f4", finish: "Gloss" },
  { name: "Ice Blue", hex: "#9bd9ec", finish: "Gloss" },
  { name: "Racing Red", hex: "#a52128", finish: "Gloss" },
  { name: "Deep Navy", hex: "#182b43", finish: "Satin" },
];


export const kitCategories = [
  { slug: "colour", title: "Colour PPF kits", description: "Make a statement with coloured protection film, cut for selected panels and vehicle patterns.", count: "Colour range" },
  { slug: "universal", title: "Universal protection", description: "Useful protection pieces for common contact points across a broad range of vehicles.", count: "Universal fit" },
  { slug: "replacement-panels", title: "Replacement panels", description: "Replace an individual piece when a panel needs a refresh or a previous kit needs a repair.", count: "Single panels" },
  { slug: "tools", title: "Tools & care", description: "Squeegees, application essentials and aftercare to support a considered installation.", count: "Install essentials" },
];

export function getMake(slug: string) { return vehicleMakes.find((make) => make.slug === slug); }
export function getVehicle(makeSlug: string, modelSlug: string) { const make = getMake(makeSlug); const model = make?.models.find((item) => item.slug === modelSlug); return make && model ? { make, model } : undefined; }

export function getKits(makeSlug: string, modelSlug: string) { const make = getMake(makeSlug); const model = make?.models.find((item) => item.slug === modelSlug); return make && model ? [{ make, model, status: "pattern-review" }] : []; }

export function getVehicleSelection(makeSlug: string, selectedSlug: string) {
  const match = selectedSlug.match(/^(.*)-(20\d{2})$/);
  const modelSlug = match?.[1] ?? selectedSlug;
  const year = match ? Number(match[2]) : undefined;
  const vehicle = getVehicle(makeSlug, modelSlug);
  if (!vehicle || (year && !vehicle.model.years.includes(year))) return undefined;
  return { ...vehicle, year };
}
