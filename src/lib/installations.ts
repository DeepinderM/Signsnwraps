import "server-only";
import { FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";
import type { BillingDoc } from "@/lib/billing";
import { installBlockers, weatherCleared, weatherKey, worstVerdict, type Installation, type InstallLocation, type LiftBooking, type WeatherCheck } from "@/lib/installation-types";
import type { StoreId } from "@/lib/staff";
import { forecastFor } from "@/lib/weather";

// Installations for accepted jobs, one per quote (stored under the quote id, like purchase orders). A job that has an
// installation line gets one automatically when it's invoiced; staff can add one to any accepted job.

const installs = () => db().collection("installations");
const millis = (value: unknown) => (value instanceof Timestamp ? value.toMillis() : typeof value === "number" ? value : 0);
const NO_LIFT: LiftBooking = { booked: false, supplier: "", reference: "", date: "", cost: "", bookedBy: "", bookedAt: 0 };

/** Lines that mean the job is installed by us, and lines that mean a lift / access is needed. */
const INSTALL_LINE = /\b(install|installation|fit[- ]?out|fitting)\b|^INST-/i;
const LIFT_LINE = /\b(lift|ewp|scissor|boom|cherry ?picker|scaffold\w*|access equipment)\b/i;
export const needsInstallation = (doc: Pick<BillingDoc, "items">) => doc.items.some((item) => INSTALL_LINE.test(item.code ?? "") || INSTALL_LINE.test(item.description.split("\n")[0]));
const needsLift = (doc: Pick<BillingDoc, "items">) => doc.items.some((item) => LIFT_LINE.test(item.description.split("\n")[0]));
const liftTypeFor = (doc: Pick<BillingDoc, "items">) => {
  const line = doc.items.map((item) => item.description.split("\n")[0]).find((text) => LIFT_LINE.test(text)) ?? "";
  return /scissor/i.test(line) ? "Scissor lift" : /boom|ewp/i.test(line) ? "Boom lift / EWP" : /cherry/i.test(line) ? "Cherry picker" : /scaffold/i.test(line) ? "Scaffold" : line ? "Other" : "";
};
const quoteIdOf = (doc: Pick<BillingDoc, "id" | "kind" | "fromQuoteId">) => (doc.kind === "quote" ? doc.id : doc.fromQuoteId || doc.id);

function toInstallation(id: string, data: DocumentData): Installation {
  return {
    id, quoteId: data.quoteId ?? id, quoteNumber: data.quoteNumber ?? "", invoiceId: data.invoiceId ?? "", invoiceNumber: data.invoiceNumber ?? "", store: data.store ?? null,
    title: data.title ?? "", customerName: data.customerName ?? "", siteAddress: data.siteAddress ?? "", contactPhone: data.contactPhone ?? "",
    date: data.date ?? "", startTime: data.startTime ?? "", days: Number(data.days) || 1, location: (["outside", "inside"].includes(data.location) ? data.location : "") as InstallLocation,
    installers: data.installers ?? "", notes: data.notes ?? "", liftRequired: data.liftRequired === true, liftType: data.liftType ?? "", lift: { ...NO_LIFT, ...(data.lift ?? {}) },
    weather: data.weather ?? null, status: ["confirmed", "completed", "cancelled"].includes(data.status) ? data.status : "pending",
    history: Array.isArray(data.history) ? data.history : [], createdAt: millis(data.createdAt), confirmedAt: millis(data.confirmedAt), completedAt: millis(data.completedAt),
  };
}

export async function getInstallation(quoteId: string) {
  if (!quoteId) return null;
  const snap = await installs().doc(quoteId).get();
  return snap.exists ? toInstallation(snap.id, snap.data()!) : null;
}
export const getInstallationFor = (doc: Pick<BillingDoc, "id" | "kind" | "fromQuoteId">) => getInstallation(quoteIdOf(doc));

export async function listInstallations(store?: StoreId) {
  const snap = await (store ? installs().where("store", "==", store) : installs()).get();
  return snap.docs.map((doc) => toInstallation(doc.id, doc.data()));
}

/** The installation for a job, made if missing (site and contact from the customer; lift needed if the quote has a lift line). */
export async function ensureInstallation(doc: BillingDoc, by: string, invoice?: { id: string; number: string }) {
  const id = quoteIdOf(doc);
  const existing = await getInstallation(id);
  if (existing) {
    if (invoice && !existing.invoiceId) { await installs().doc(id).update({ invoiceId: invoice.id, invoiceNumber: invoice.number }); return { ...existing, invoiceId: invoice.id, invoiceNumber: invoice.number }; }
    return existing;
  }
  const data = {
    quoteId: id, quoteNumber: doc.kind === "quote" ? doc.number : "", invoiceId: invoice?.id ?? (doc.kind === "invoice" ? doc.id : ""), invoiceNumber: invoice?.number ?? (doc.kind === "invoice" ? doc.number : ""),
    store: doc.store ?? null, title: doc.title, customerName: doc.customer.business || doc.customer.name, siteAddress: doc.customer.address, contactPhone: doc.customer.phone,
    date: "", startTime: "", days: 1, location: "", installers: "", notes: "", liftRequired: needsLift(doc), liftType: liftTypeFor(doc), lift: NO_LIFT, weather: null, status: "pending",
    history: [{ at: Date.now(), by, text: `Installation added for ${doc.kind} ${doc.number}` }], createdAt: FieldValue.serverTimestamp(),
  };
  await installs().doc(id).set(data);
  return toInstallation(id, { ...data, createdAt: Date.now() });
}

const log = (by: string, text: string) => FieldValue.arrayUnion({ at: Date.now(), by, text });

export type InstallDetails = Pick<Installation, "date" | "startTime" | "days" | "location" | "installers" | "notes" | "siteAddress" | "contactPhone" | "liftRequired" | "liftType">;

/** Saves the schedule details. A new date / number of days voids the weather check and, if confirmed, puts it back to pending. */
export async function saveInstallationDetails(id: string, details: InstallDetails, by: string) {
  const current = await getInstallation(id);
  if (!current) return { error: "Installation not found." };
  if (current.status === "completed" || current.status === "cancelled") return { error: "This installation is closed. Reopen it first." };
  const dateChanged = current.date !== details.date || current.days !== details.days;
  const placeChanged = current.siteAddress !== details.siteAddress || current.location !== details.location;
  const changes: Record<string, unknown> = { ...details };
  const notes: string[] = [];
  if (dateChanged) notes.push(details.date ? `Date set to ${details.date}${details.days > 1 ? ` (${details.days} days)` : ""}${details.startTime ? ` at ${details.startTime}` : ""}` : "Date cleared");
  if (current.weather && (dateChanged || placeChanged)) { changes.weather = null; notes.push("Weather check cleared (date or site changed)"); }
  if (current.status === "confirmed" && (dateChanged || placeChanged || (details.liftRequired && !current.lift.booked))) { changes.status = "pending"; notes.push("Back to pending: re-confirm after the checks"); }
  if (current.lift.booked && dateChanged && current.lift.date && details.date && current.lift.date > details.date) notes.push("Lift is booked after the new installation date: change the lift booking");
  await installs().doc(id).update({ ...changes, updatedAt: FieldValue.serverTimestamp(), history: log(by, notes.length ? notes.join(" · ") : "Details updated") });
  return { ok: notes.length ? notes.join(". ") + "." : "Saved." };
}

/** Fetches the forecast for the site and the installation day(s) and records the result. */
export async function checkInstallationWeather(id: string, by: string) {
  const current = await getInstallation(id);
  if (!current) return { error: "Installation not found." };
  if (!current.date) return { error: "Set the installation date first." };
  if (current.location !== "outside") return { error: "The weather check is for outside jobs." };
  if (!current.siteAddress.trim()) return { error: "Add the site address first." };
  const forecast = await forecastFor(current.siteAddress, current.store, current.date, current.days).catch((reason) => ({ error: reason instanceof Error ? reason.message : "The weather service didn't respond." }));
  if ("error" in forecast) return { error: `${forecast.error} Try again in a minute.` };
  const verdict = worstVerdict(forecast.days);
  const check: WeatherCheck = { checkedFor: weatherKey(current), checkedAt: Date.now(), by, place: forecast.place, verdict, days: forecast.days, override: "" };
  await installs().doc(id).update({ weather: check, updatedAt: FieldValue.serverTimestamp(), history: log(by, `Weather checked for ${forecast.place}: ${verdict}`) });
  return { ok: `Weather checked: ${verdict}.` };
}

/** Proceed despite the forecast (e.g. not out yet, or the crew will work around it): needs a reason, which is recorded. */
export async function overrideInstallationWeather(id: string, reason: string, by: string) {
  const current = await getInstallation(id);
  if (!current?.weather || current.weather.checkedFor !== weatherKey(current)) return { error: "Check the weather for the current date first." };
  const text = reason.trim().slice(0, 500);
  if (text.length < 5) return { error: "Say why it's OK to go ahead (e.g. checked BOM, crew will work around the morning showers)." };
  await installs().doc(id).update({ "weather.override": text, history: log(by, `Weather override: ${text}`) });
  return { ok: "Override recorded. You can book the lift now." };
}

/** Records the lift booking. Outside jobs need the weather cleared first; the lift must arrive on or before the install date. */
export async function bookInstallationLift(id: string, booking: Pick<LiftBooking, "supplier" | "reference" | "date" | "cost">, by: string) {
  const current = await getInstallation(id);
  if (!current) return { error: "Installation not found." };
  if (!current.date) return { error: "Set the installation date before booking the lift." };
  if (!current.location) return { error: "Say whether the job is inside or outside first." };
  if (!weatherCleared(current)) return { error: "Outside job: check the weather for the installation day(s) before booking the lift." };
  if (!booking.supplier.trim()) return { error: "Who is the lift booked with?" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(booking.date)) return { error: "Add the lift date." };
  if (booking.date > current.date) return { error: "The lift has to be booked for the installation date (or before), not after it." };
  await installs().doc(id).update({ lift: { booked: true, ...booking, bookedBy: by, bookedAt: Date.now() }, history: log(by, `Lift booked with ${booking.supplier}${booking.reference ? ` (ref ${booking.reference})` : ""} for ${booking.date}`) });
  return { ok: "Lift booked." };
}

export async function cancelInstallationLift(id: string, by: string) {
  const current = await getInstallation(id);
  if (!current) return { error: "Installation not found." };
  await installs().doc(id).update({ lift: NO_LIFT, ...(current.status === "confirmed" && current.liftRequired ? { status: "pending" } : {}), history: log(by, "Lift booking cancelled") });
  return { ok: "Lift booking removed." };
}

/** Confirm (only when nothing is blocking), complete, cancel or reopen. */
export async function setInstallationStatus(id: string, action: "confirm" | "complete" | "cancel" | "reopen", by: string) {
  const current = await getInstallation(id);
  if (!current) return { error: "Installation not found." };
  if (action === "confirm") {
    const blockers = installBlockers(current);
    if (blockers.length) return { error: `Before confirming: ${blockers.map((step) => step.text.toLowerCase()).join(", ")}.` };
    await installs().doc(id).update({ status: "confirmed", confirmedAt: FieldValue.serverTimestamp(), history: log(by, `Installation confirmed for ${current.date}${current.startTime ? ` at ${current.startTime}` : ""}`) });
    return { ok: "Installation confirmed." };
  }
  if (action === "complete") {
    if (current.status !== "confirmed") return { error: "Confirm the installation first." };
    await installs().doc(id).update({ status: "completed", completedAt: FieldValue.serverTimestamp(), history: log(by, "Installation completed") });
    return { ok: "Marked as installed." };
  }
  if (action === "cancel") { await installs().doc(id).update({ status: "cancelled", history: log(by, "Installation cancelled") }); return { ok: "Installation cancelled." }; }
  await installs().doc(id).update({ status: "pending", history: log(by, "Reopened") });
  return { ok: "Reopened." };
}
