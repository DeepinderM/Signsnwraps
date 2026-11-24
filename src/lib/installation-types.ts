import type { StoreId } from "@/lib/staff";

// Installation management (client-safe types and rules; the server enforces the same rules in installations.ts).
//
// The order is fixed:  date set → (outside jobs) weather check passes → (lift jobs) lift booked → installation confirmed.
// Changing the date or the number of days voids the weather check, so it has to be done again for the new dates.

export type InstallLocation = "outside" | "inside" | "";
export type InstallStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type WeatherVerdict = "good" | "caution" | "unsuitable" | "unavailable";
export type WeatherDay = { date: string; rainChance: number; rainMm: number; gustKmh: number; tempMax: number; code: number; verdict: WeatherVerdict; reasons: string[] };
export type WeatherCheck = { checkedFor: string; checkedAt: number; by: string; place: string; verdict: WeatherVerdict; days: WeatherDay[]; override: string };
export type LiftBooking = { booked: boolean; supplier: string; reference: string; date: string; cost: string; bookedBy: string; bookedAt: number };
export type InstallEvent = { at: number; by: string; text: string };

export type Installation = {
  id: string; quoteId: string; quoteNumber: string; invoiceId: string; invoiceNumber: string; store: StoreId | null;
  title: string; customerName: string; siteAddress: string; contactPhone: string;
  date: string; startTime: string; days: number; location: InstallLocation; installers: string; notes: string;
  liftRequired: boolean; liftType: string; lift: LiftBooking;
  weather: WeatherCheck | null;
  status: InstallStatus; history: InstallEvent[]; createdAt: number; confirmedAt: number; completedAt: number;
};

export const LIFT_TYPES = ["Scissor lift", "Boom lift / EWP", "Cherry picker", "Scaffold", "Ladder / platform only", "Other"];

/**
 * Weather limits for outdoor sign installs (lift work). Gusts: most EWPs and scissor lifts are rated to 12.5 m/s (45 km/h).
 * Unsuitable: gusts ≥ 45 km/h, rain chance ≥ 60 % or ≥ 5 mm. Caution: gusts ≥ 35 km/h, rain chance ≥ 30 % or ≥ 1 mm.
 */
export const WEATHER_LIMITS = { gustUnsafe: 45, gustCaution: 35, rainChanceBad: 60, rainChanceCaution: 30, rainMmBad: 5, rainMmCaution: 1 };
/** Forecasts only go about 16 days ahead. */
export const FORECAST_DAYS = 16;

export function assessDay(day: Omit<WeatherDay, "verdict" | "reasons">): WeatherDay {
  const reasons: string[] = []; let verdict: WeatherVerdict = "good";
  const flag = (level: WeatherVerdict, reason: string) => { reasons.push(reason); if (level === "unsuitable" || verdict === "good") verdict = level; };
  if (day.gustKmh >= WEATHER_LIMITS.gustUnsafe) flag("unsuitable", `Wind gusts ${Math.round(day.gustKmh)} km/h (lift limit ${WEATHER_LIMITS.gustUnsafe})`);
  else if (day.gustKmh >= WEATHER_LIMITS.gustCaution) flag("caution", `Gusty: ${Math.round(day.gustKmh)} km/h`);
  if (day.rainChance >= WEATHER_LIMITS.rainChanceBad || day.rainMm >= WEATHER_LIMITS.rainMmBad) flag("unsuitable", `Rain likely: ${day.rainChance}% chance, ${day.rainMm} mm`);
  else if (day.rainChance >= WEATHER_LIMITS.rainChanceCaution || day.rainMm >= WEATHER_LIMITS.rainMmCaution) flag("caution", `Possible rain: ${day.rainChance}% chance, ${day.rainMm} mm`);
  return { ...day, verdict, reasons };
}
export const worstVerdict = (days: { verdict: WeatherVerdict }[]): WeatherVerdict =>
  (["unsuitable", "unavailable", "caution", "good"] as WeatherVerdict[]).find((level) => days.some((day) => day.verdict === level)) ?? "unavailable";
export const verdictLabel: Record<WeatherVerdict, string> = { good: "Good", caution: "Caution", unsuitable: "Not suitable", unavailable: "No forecast yet" };

/** The installation dates (YYYY-MM-DD) for a start date and number of days. */
export function installDates(date: string, days: number) {
  if (!date) return [];
  return Array.from({ length: Math.max(1, days) }, (_, index) => { const d = new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + index); return d.toISOString().slice(0, 10); });
}
export const weatherKey = (inst: Pick<Installation, "date" | "days">) => `${inst.date}|${Math.max(1, inst.days)}`;

/** The weather check counts if it's for the current dates and either passed (good / caution) or was overridden with a reason. */
export function weatherCleared(inst: Pick<Installation, "location" | "date" | "days" | "weather">) {
  if (inst.location !== "outside") return true;
  const check = inst.weather;
  return !!check && check.checkedFor === weatherKey(inst) && (check.verdict === "good" || check.verdict === "caution" || !!check.override.trim());
}

/** What still has to happen, in order. Empty = ready to confirm. */
export function installBlockers(inst: Installation) {
  const steps: { key: "date" | "location" | "weather" | "lift"; text: string }[] = [];
  if (!inst.date) steps.push({ key: "date", text: "Set the installation date" });
  if (!inst.location) steps.push({ key: "location", text: "Say whether the job is inside or outside" });
  if (inst.location === "outside" && !weatherCleared(inst)) steps.push({ key: "weather", text: inst.weather && inst.weather.checkedFor !== weatherKey(inst) ? "Check the weather again: the date changed" : "Check the weather for the installation day(s)" });
  if (inst.liftRequired && !inst.lift.booked) steps.push({ key: "lift", text: "Book the lift" });
  return steps;
}

/** Where the job is, for lists and badges. */
export function installStage(inst: Installation): { key: string; label: string } {
  if (inst.status === "completed") return { key: "completed", label: "Installed" };
  if (inst.status === "cancelled") return { key: "cancelled", label: "Cancelled" };
  if (inst.status === "confirmed") return { key: "confirmed", label: "Confirmed" };
  const next = installBlockers(inst)[0];
  if (!next) return { key: "ready", label: "Ready to confirm" };
  return { key: `needs-${next.key}`, label: next.key === "date" ? "To schedule" : next.key === "location" ? "Inside / outside?" : next.key === "weather" ? "Weather check needed" : "Lift to book" };
}
