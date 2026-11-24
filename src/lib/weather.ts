import "server-only";
import { assessDay, FORECAST_DAYS, installDates, type WeatherDay } from "@/lib/installation-types";
import type { StoreId } from "@/lib/staff";

// Forecasts for outdoor installs from Open-Meteo (no key needed for testing). Open-Meteo's free API is for
// non-commercial use: for the live site set OPEN_METEO_API_KEY (a paid plan) and the customer endpoints are used.

const key = process.env.OPEN_METEO_API_KEY;
const GEO = key ? "https://customer-geocoding-api.open-meteo.com/v1/search" : "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST = key ? "https://customer-api.open-meteo.com/v1/forecast" : "https://api.open-meteo.com/v1/forecast";
const withKey = (params: URLSearchParams) => { if (key) params.set("apikey", key); return params; };

/** Where each store is, for sites whose suburb can't be found. */
const STORE_CENTRES: Record<StoreId, { name: string; latitude: number; longitude: number; timezone: string }> = {
  melbourne: { name: "Melbourne VIC", latitude: -37.8136, longitude: 144.9631, timezone: "Australia/Melbourne" },
  "south-australia": { name: "Adelaide SA", latitude: -34.9285, longitude: 138.6007, timezone: "Australia/Adelaide" },
  nsw: { name: "Sydney NSW", latitude: -33.8688, longitude: 151.2093, timezone: "Australia/Sydney" },
};
const STATES: Record<string, string> = { VIC: "Victoria", NSW: "New South Wales", SA: "South Australia", QLD: "Queensland", WA: "Western Australia", TAS: "Tasmania", ACT: "Australian Capital Territory", NT: "Northern Territory" };

/** Suburb, state and postcode from an Australian address ("12 Example St, Laverton North VIC 3026"). */
export function parseAddress(address: string) {
  const match = /([A-Za-z][A-Za-z' -]+?)\s+(VIC|NSW|SA|QLD|WA|TAS|ACT|NT)\b\.?\s*(\d{4})?/i.exec(address);
  if (!match) return null;
  const suburb = match[1].split(",").pop()!.trim().replace(/^\d+\s+/, "");
  return { suburb, state: match[2].toUpperCase(), postcode: match[3] ?? "" };
}

async function json(url: string) {
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Weather service error ${response.status}`);
  return response.json();
}

/** Coordinates for the site: the suburb from the address (matched on state / postcode), else the store's city. */
export async function locateSite(address: string, store: StoreId | null) {
  const parsed = parseAddress(address);
  if (parsed) {
    const data = await json(`${GEO}?${withKey(new URLSearchParams({ name: parsed.suburb, count: "10", country_code: "AU", language: "en" }))}`).catch(() => null);
    const results: { name: string; latitude: number; longitude: number; admin1?: string; postcodes?: string[]; timezone: string }[] = data?.results ?? [];
    const best = results.find((item) => parsed.postcode && item.postcodes?.includes(parsed.postcode)) ?? results.find((item) => item.admin1 === STATES[parsed.state]) ?? null;
    if (best) return { name: `${best.name} ${parsed.state}`, latitude: best.latitude, longitude: best.longitude, timezone: best.timezone || "Australia/Melbourne", exact: true };
  }
  const centre = STORE_CENTRES[store ?? "melbourne"];
  return { ...centre, exact: false };
}

/** Day-by-day forecast and verdict for the installation dates. Days beyond the forecast range come back "unavailable". */
export async function forecastFor(address: string, store: StoreId | null, date: string, days: number): Promise<{ place: string; days: WeatherDay[] }> {
  const site = await locateSite(address, store);
  const dates = installDates(date, days);
  const today = new Date().toISOString().slice(0, 10);
  const last = new Date(); last.setUTCDate(last.getUTCDate() + FORECAST_DAYS - 1);
  const inRange = dates.filter((day) => day >= today && day <= last.toISOString().slice(0, 10));
  const byDate = new Map<string, WeatherDay>();
  if (inRange.length) {
    const params = withKey(new URLSearchParams({ latitude: String(site.latitude), longitude: String(site.longitude), timezone: site.timezone, start_date: inRange[0], end_date: inRange.at(-1)!,
      daily: "precipitation_probability_max,precipitation_sum,wind_gusts_10m_max,temperature_2m_max,weather_code" }));
    const data = await json(`${FORECAST}?${params}`);
    (data.daily?.time ?? []).forEach((day: string, index: number) => byDate.set(day, assessDay({
      date: day, rainChance: Number(data.daily.precipitation_probability_max?.[index] ?? 0), rainMm: Number(data.daily.precipitation_sum?.[index] ?? 0),
      gustKmh: Number(data.daily.wind_gusts_10m_max?.[index] ?? 0), tempMax: Number(data.daily.temperature_2m_max?.[index] ?? 0), code: Number(data.daily.weather_code?.[index] ?? 0),
    })));
  }
  const place = `${site.name}${site.exact ? "" : " (store area: the site's suburb couldn't be found)"}`;
  return {
    place,
    days: dates.map((day) => byDate.get(day) ?? { date: day, rainChance: 0, rainMm: 0, gustKmh: 0, tempMax: 0, code: 0, verdict: "unavailable", reasons: [day < today ? "Date has passed" : `Forecast not out yet (about ${FORECAST_DAYS} days ahead)`] }),
  };
}
