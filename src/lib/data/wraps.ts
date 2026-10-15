export type VehicleModel = { slug: string; name: string; body: "Ute" | "4WD" | "SUV" | "Car"; years: number[] };
export type VehicleMake = { slug: string; name: string; models: VehicleModel[] };

// Initial finder examples only. Confirm pattern-library coverage and fitment years before displaying purchasable stock.
export const vehicleMakes: VehicleMake[] = [
  { slug: "toyota", name: "Toyota", models: [{ slug: "hilux", name: "Hilux", body: "Ute", years: [2024, 2023, 2022, 2021] }, { slug: "landcruiser", name: "LandCruiser", body: "4WD", years: [2024, 2023, 2022] }, { slug: "rav4", name: "RAV4", body: "SUV", years: [2024, 2023, 2022] }] },
  { slug: "ford", name: "Ford", models: [{ slug: "ranger", name: "Ranger", body: "Ute", years: [2024, 2023, 2022, 2021] }, { slug: "everest", name: "Everest", body: "4WD", years: [2024, 2023, 2022] }] },
  { slug: "mazda", name: "Mazda", models: [{ slug: "bt-50", name: "BT-50", body: "Ute", years: [2024, 2023, 2022] }, { slug: "cx-5", name: "CX-5", body: "SUV", years: [2024, 2023, 2022] }] },
  { slug: "isuzu", name: "Isuzu", models: [{ slug: "d-max", name: "D-MAX", body: "Ute", years: [2024, 2023, 2022] }, { slug: "mu-x", name: "MU-X", body: "4WD", years: [2024, 2023, 2022] }] },
  { slug: "mitsubishi", name: "Mitsubishi", models: [{ slug: "triton", name: "Triton", body: "Ute", years: [2024, 2023, 2022] }, { slug: "pajero-sport", name: "Pajero Sport", body: "4WD", years: [2024, 2023, 2022] }, { slug: "outlander", name: "Outlander", body: "SUV", years: [2024, 2023, 2022] }] },
  { slug: "nissan", name: "Nissan", models: [{ slug: "navara", name: "Navara", body: "Ute", years: [2024, 2023, 2022] }, { slug: "patrol", name: "Patrol", body: "4WD", years: [2024, 2023, 2022] }] },
  { slug: "subaru", name: "Subaru", models: [{ slug: "forester", name: "Forester", body: "SUV", years: [2024, 2023, 2022] }, { slug: "outback", name: "Outback", body: "Car", years: [2024, 2023, 2022] }] },
];

export const kitCoverage = [
  { slug: "front-protection", name: "Front protection", detail: "A focused start for high-impact areas." },
  { slug: "full-front", name: "Full front", detail: "A broader front-end coverage option." },
  { slug: "door-edges-cups", name: "Door edges & cups", detail: "Small-area protection for frequent contact points." },
  { slug: "sills-tailgate", name: "Sills & tailgate", detail: "Protection for entry and loading areas." },
  { slug: "headlights", name: "Headlights", detail: "A clear protective layer for light lenses." },
  { slug: "full-vehicle", name: "Full vehicle", detail: "A full-body coverage consultation." },
];

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
