import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getBillingDoc, getBillingSettings } from "@/lib/billing";
import { billingViewUrl } from "@/lib/billing-links";
import { emailMode, sendCustomerEmail } from "@/lib/email";
import { db } from "@/lib/firebase/admin";
import { installBlockers, installDates, verdictLabel, worstVerdict, weatherKey, type Installation, type WeatherCheck } from "@/lib/installation-types";
import { listInstallations } from "@/lib/installations";
import { absoluteUrl } from "@/lib/seo";
import { formatAud } from "@/lib/shop/catalog";
import { envSuperAdmins, storeLabel, storeStaffEmails } from "@/lib/staff";
import { isEmail } from "@/lib/validation";
import { forecastFor } from "@/lib/weather";

// Installation emails: the customer's booking confirmation, and the staff's day-before check (re-run weather + summary).

const longDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const time12 = (hhmm: string) => { if (!hhmm) return ""; const [h, m] = hhmm.split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`; };
const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";

/** Emails the customer their installation booking (or the new date, when it was confirmed before). Logged in the invoice's email thread. */
export async function emailInstallationToCustomer(inst: Installation, by: { name: string; email: string }) {
  const doc = await getBillingDoc(inst.invoiceId || inst.quoteId);
  if (!doc) return { error: "The job's invoice couldn't be found." };
  if (!isEmail(doc.customer.email)) return { error: "The customer has no email address on the invoice." };
  const settings = await getBillingSettings();
  const updated = inst.history.filter((event) => event.text.startsWith("Installation confirmed")).length > 1;
  const days = installDates(inst.date, inst.days);
  // Progress payment ("before installation") still to pay: ask for it in the same email.
  const progress = doc.kind === "invoice" ? doc.schedule.find((stage) => stage.key === "installation" && stage.status !== "paid") : undefined;
  const lines = [
    `Hi ${firstName(doc.customer.name)},`, "",
    updated ? `Your installation${doc.title ? ` for ${doc.title}` : ""} has a new date:` : `Great news: your installation${doc.title ? ` for ${doc.title}` : ""} is booked.`, "",
    `Date: ${longDate(inst.date)}${days.length > 1 ? ` to ${longDate(days.at(-1)!)} (${days.length} days)` : ""}`,
    ...(inst.startTime ? [`Arrival: from ${time12(inst.startTime)}`] : []),
    `Site: ${inst.siteAddress || doc.customer.address}`, "",
    "To help the day go smoothly, please make sure:",
    "- the area where the sign is going is clear and we can get to it",
    ...(inst.liftRequired ? ["- there's room for the lift and somewhere for it to park (we'll let you know if a permit is needed)"] : []),
    "- someone is on site to let us in and sign off when we finish",
    ...(inst.location === "outside" ? ["", "Outdoor installs depend on the weather. We check the forecast the day before, and if it's too windy or wet to work safely we'll call you to move the date."] : []),
    ...(progress ? ["", `As per our payment terms, the ${progress.label.toLowerCase()} of ${formatAud(progress.amountCents)} is due before installation. You can pay online here:`, billingViewUrl(doc.token)] : []),
    "", `Questions or need to change the date? Just reply to this email or call us on ${settings.phone}.`, "",
    "Kind regards,", by.name || "The Signsnwraps team", settings.businessName,
  ];
  const result = await sendCustomerEmail({
    to: doc.customer.email, subject: `${updated ? "Updated installation date" : "Installation booked"}: ${longDate(inst.date)}${doc.title ? ` (${doc.title})` : ""}`,
    body: lines.join("\n"), sentBy: by, context: { type: "billing", id: doc.id },
  });
  if ("error" in result) return { error: result.error };
  await db().collection("installations").doc(inst.id).update({ history: FieldValue.arrayUnion({ at: Date.now(), by: by.name || by.email, text: `${emailMode() === "log" ? "Dev mode: customer email logged (not sent)" : "Customer emailed"}: ${updated ? "updated date" : "installation booked"} (${doc.customer.email})` }) });
  return { ok: `Customer emailed (${doc.customer.email}).` };
}

const AUTO = "Day-before check";

/**
 * Day-before check for one date (default: tomorrow in Melbourne): re-checks the forecast for every outside job, records it,
 * and emails the store's staff (plus the business mailbox) a summary of each installation. Returns what it did.
 */
export async function runDayBeforeCheck(date?: string) {
  const tomorrow = date ?? (() => { const now = new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" }).format(new Date()) + "T00:00:00Z"); now.setUTCDate(now.getUTCDate() + 1); return now.toISOString().slice(0, 10); })();
  const jobs = (await listInstallations()).filter((inst) => (inst.status === "pending" || inst.status === "confirmed") && inst.date && installDates(inst.date, inst.days).includes(tomorrow));
  const settings = await getBillingSettings();
  const report: string[] = [];
  for (const inst of jobs) {
    let weather = inst.weather;
    let weatherLine = inst.location === "inside" ? "Inside job: no weather check needed." : inst.location ? "" : "Inside / outside not set.";
    if (inst.location === "outside" && inst.siteAddress) {
      const forecast = await forecastFor(inst.siteAddress, inst.store, inst.date, inst.days).catch(() => null);
      if (forecast) {
        // Keep an earlier override only if the forecast hasn't got worse than "caution".
        const verdict = worstVerdict(forecast.days);
        const keepOverride = inst.weather?.checkedFor === weatherKey(inst) && inst.weather.override && (verdict === "good" || verdict === "caution") ? inst.weather.override : "";
        weather = { checkedFor: weatherKey(inst), checkedAt: Date.now(), by: AUTO, place: forecast.place, verdict, days: forecast.days, override: keepOverride } satisfies WeatherCheck;
        await db().collection("installations").doc(inst.id).update({ weather, history: FieldValue.arrayUnion({ at: Date.now(), by: AUTO, text: `Weather re-checked for ${forecast.place}: ${verdict}` }) });
        const day = forecast.days.find((item) => item.date === tomorrow);
        weatherLine = day ? `Weather ${longDate(tomorrow)}: ${verdictLabel[day.verdict].toUpperCase()}${day.verdict !== "unavailable" ? ` · rain ${day.rainChance}% (${day.rainMm} mm) · gusts ${Math.round(day.gustKmh)} km/h · max ${Math.round(day.tempMax)}°C` : ""}${day.reasons.length ? ` · ${day.reasons.join("; ")}` : ""}` : "";
        if (verdict === "unsuitable") weatherLine += "\n  ⚠ NOT SUITABLE for lift work: call the customer and move the date, or confirm the crew can work safely.";
      } else weatherLine = "Weather: the forecast service didn't respond. Check BOM manually.";
    }
    const fresh = { ...inst, weather };
    const blockers = installBlockers(fresh);
    report.push([
      `${inst.title || inst.customerName} (${[inst.quoteNumber, inst.invoiceNumber].filter(Boolean).join(" / ")})`,
      `  ${inst.startTime ? `${time12(inst.startTime)} · ` : ""}${inst.siteAddress || "no site address"}${inst.contactPhone ? ` · site contact ${inst.contactPhone}` : ""}`,
      `  Installers: ${inst.installers || "not set"} · Status: ${inst.status === "confirmed" ? "confirmed" : "NOT CONFIRMED"}`,
      `  Lift: ${inst.liftRequired ? inst.lift.booked ? `${inst.liftType || "booked"} with ${inst.lift.supplier}${inst.lift.reference ? ` (ref ${inst.lift.reference})` : ""} for ${inst.lift.date}` : "NEEDED BUT NOT BOOKED" : "not needed"}`,
      weatherLine && `  ${weatherLine}`,
      blockers.length ? `  Still to do: ${blockers.map((step) => step.text.toLowerCase()).join("; ")}` : "",
      `  ${absoluteUrl(`/admin/installations/${inst.id}`)}`,
    ].filter(Boolean).join("\n"));
    // One email per job to that store's staff and the business mailbox (super admins too when the job has no store).
    const to = [...new Set([...(inst.store ? await storeStaffEmails(inst.store).catch(() => []) : envSuperAdmins()), settings.email].map((email) => email.toLowerCase()).filter(isEmail))];
    if (to.length) await sendCustomerEmail({
      to: to.join(", "), subject: `Tomorrow's installation: ${inst.title || inst.customerName}${weather?.verdict === "unsuitable" ? " · WEATHER NOT SUITABLE" : blockers.length ? " · ACTION NEEDED" : ""}`,
      body: [`Installation tomorrow, ${longDate(tomorrow)} (${storeLabel(inst.store)}):`, "", report.at(-1)!, "", "This check runs automatically every morning."].join("\n"),
      sentBy: { name: AUTO, email: "" }, context: { type: "installation", id: inst.id },
    }).catch(() => undefined);
  }
  return { date: tomorrow, count: jobs.length, report };
}
