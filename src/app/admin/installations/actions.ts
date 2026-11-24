"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, type Admin } from "@/lib/admin-auth";
import { getBillingDoc } from "@/lib/billing";
import {
  bookInstallationLift, cancelInstallationLift, checkInstallationWeather, ensureInstallation, getInstallation, overrideInstallationWeather, saveInstallationDetails, setInstallationStatus,
} from "@/lib/installations";
import { setBillingStatus } from "@/lib/billing";
import { emailInstallationToCustomer, runDayBeforeCheck } from "@/lib/installation-notify";

export type InstallResult = { ok?: string; error?: string; at?: number } | null;

const who = (admin: Admin) => admin.name || admin.email;
const canAccess = (admin: Admin, store: string | null) => admin.role === "super" || (!!admin.store && store === admin.store);
const text = (form: FormData, key: string, max: number) => String(form.get(key) ?? "").trim().slice(0, max);

/** One action for the installation page; `op` picks what to do. Every op re-checks the rules on the server. */
export async function installationAction(_: InstallResult, form: FormData): Promise<InstallResult> {
  const admin = await requireAdmin();
  const id = text(form, "id", 64);
  const inst = /^[A-Za-z0-9_-]{1,64}$/.test(id) ? await getInstallation(id) : null;
  if (!inst || !canAccess(admin, inst.store)) return { error: "This installation isn't available to you." };
  const by = who(admin), op = text(form, "op", 20);
  let result: { ok?: string; error?: string };
  if (op === "save") {
    const date = text(form, "date", 10), startTime = text(form, "startTime", 5), location = text(form, "location", 10);
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Choose a valid date." };
    if (startTime && !/^\d{2}:\d{2}$/.test(startTime)) return { error: "Choose a valid start time." };
    const days = Math.min(30, Math.max(1, Math.floor(Number(form.get("days")) || 1)));
    result = await saveInstallationDetails(id, {
      date, startTime, days, location: location === "outside" || location === "inside" ? location : "", installers: text(form, "installers", 300), notes: text(form, "notes", 2000),
      siteAddress: text(form, "siteAddress", 300), contactPhone: text(form, "contactPhone", 40), liftRequired: form.get("liftRequired") === "on", liftType: text(form, "liftType", 60),
    }, by);
  } else if (op === "weather") result = await checkInstallationWeather(id, by);
  else if (op === "override") result = await overrideInstallationWeather(id, text(form, "reason", 500), by);
  else if (op === "lift") result = await bookInstallationLift(id, { supplier: text(form, "supplier", 120), reference: text(form, "reference", 80), date: text(form, "liftDate", 10), cost: text(form, "cost", 40) }, by);
  else if (op === "unlift") result = await cancelInstallationLift(id, by);
  else if (["confirm", "complete", "cancel", "reopen"].includes(op)) {
    result = await setInstallationStatus(id, op as "confirm" | "complete" | "cancel" | "reopen", by);
    // Keep the quote / invoice history in step with the big moments.
    if (result.ok && op !== "reopen") {
      const fresh = await getInstallation(id);
      // Confirming emails the customer their booking unless staff untick it.
      if (op === "confirm" && fresh && form.get("notify") === "on") {
        const sent = await emailInstallationToCustomer(fresh, { name: admin.name, email: admin.email });
        result = { ok: `${result.ok} ${"error" in sent && sent.error ? `The customer email wasn't sent: ${sent.error}` : sent.ok}` };
      }
      const note = op === "confirm" ? `Installation confirmed for ${fresh?.date}${fresh?.startTime ? ` at ${fresh.startTime}` : ""}` : op === "complete" ? "Installation completed" : "Installation cancelled";
      await Promise.all([inst.quoteId, inst.invoiceId].filter(Boolean).map((docId) => setBillingStatus(docId, {}, by, note).catch(() => undefined)));
    }
  } else return { error: "Unknown action." };
  refresh();
  return "error" in result && result.error ? { error: result.error, at: Date.now() } : { ok: result.ok, at: Date.now() };
}

/** "Add installation" from a quote / invoice page for a job that didn't have an installation line. */
export async function addInstallation(form: FormData) {
  const admin = await requireAdmin();
  const doc = await getBillingDoc(text(form, "docId", 64));
  if (!doc || !canAccess(admin, doc.store)) return;
  const inst = await ensureInstallation(doc, who(admin));
  redirect(`/admin/installations/${inst.id}`);
}

/** Super admin: run the day-before check now (normally it runs every morning). */
export async function runDayBeforeCheckNow(): Promise<InstallResult> {
  const admin = await requireAdmin();
  if (admin.role !== "super") return { error: "Only super admins can run this." };
  const result = await runDayBeforeCheck();
  refresh();
  return { ok: result.count ? `Checked ${result.count} installation${result.count === 1 ? "" : "s"} for ${result.date} and emailed the staff.` : `No installations on ${result.date}.`, at: Date.now() };
}

/** Email the customer the booking again (e.g. they lost it). */
export async function resendInstallationEmail(_: InstallResult, form: FormData): Promise<InstallResult> {
  const admin = await requireAdmin();
  const inst = await getInstallation(text(form, "id", 64));
  if (!inst || !canAccess(admin, inst.store)) return { error: "This installation isn't available to you." };
  if (inst.status !== "confirmed") return { error: "Confirm the installation first." };
  const sent = await emailInstallationToCustomer(inst, { name: admin.name, email: admin.email });
  refresh();
  return "error" in sent && sent.error ? { error: sent.error, at: Date.now() } : { ok: sent.ok, at: Date.now() };
}
