import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { listInstallations } from "@/lib/installations";
import { installBlockers, installDates, installStage, verdictLabel, weatherCleared, weatherKey, type Installation } from "@/lib/installation-types";
import { isStoreId, storeLabel, stores } from "@/lib/staff";
import { AdminNav } from "../admin-nav";
import { DayBeforeButton } from "./day-before-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Installations" };

const tabs = [["upcoming", "Upcoming"], ["week", "Next 7 days"], ["action", "Needs action"], ["schedule", "To schedule"], ["completed", "Installed"], ["all", "All"]] as const;
const dayLabel = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const addDays = (iso: string, days: number) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };

function weatherBadge(inst: Installation) {
  if (inst.location === "inside") return { key: "na", label: "Inside" };
  if (inst.location !== "outside") return { key: "todo", label: "Inside / outside?" };
  if (!inst.date) return { key: "todo", label: "—" };
  if (!inst.weather || inst.weather.checkedFor !== weatherKey(inst)) return { key: "todo", label: "Not checked" };
  if (inst.weather.override && !["good", "caution"].includes(inst.weather.verdict)) return { key: "caution", label: "Overridden" };
  return { key: inst.weather.verdict, label: verdictLabel[inst.weather.verdict] };
}

/** Every installation: what's scheduled (by date), what still needs a date, and what's blocking each job (weather, lift). */
export default async function InstallationsPage({ searchParams }: { searchParams: Promise<{ view?: string; store?: string; q?: string }> }) {
  const admin = await requireAdmin();
  const { view = "upcoming", store: rawStore = "", q = "" } = await searchParams;
  const storeFilter = admin.role === "super" && isStoreId(rawStore) ? rawStore : "";
  const all = (await listInstallations(admin.role === "super" ? undefined : admin.store ?? undefined)).filter((inst) => !storeFilter || inst.store === storeFilter);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" }).format(new Date()), week = addDays(today, 7);
  const live = all.filter((inst) => inst.status === "pending" || inst.status === "confirmed");
  const lastDay = (inst: Installation) => installDates(inst.date, inst.days).at(-1) ?? inst.date;
  const upcoming = live.filter((inst) => inst.date && lastDay(inst) >= today);
  // Needs action: no date yet, or within a week and still blocked (weather not cleared / lift not booked / not confirmed).
  const needsAction = live.filter((inst) => !inst.date || (inst.date <= week && inst.status === "pending"));
  const stats = [
    ["Next 7 days", String(upcoming.filter((inst) => inst.date <= week).length), `${upcoming.filter((inst) => inst.date <= week && inst.status === "confirmed").length} confirmed`],
    ["To schedule", String(live.filter((inst) => !inst.date).length), "Jobs without a date"],
    ["Lifts to book", String(live.filter((inst) => inst.liftRequired && !inst.lift.booked).length), "Lift needed, not booked yet"],
    ["Weather checks due", String(live.filter((inst) => inst.location === "outside" && inst.date && !weatherCleared(inst)).length), "Outside jobs with a date"],
  ];
  const query = q.trim().toLowerCase();
  const shown = (view === "upcoming" ? upcoming : view === "week" ? upcoming.filter((inst) => inst.date <= week) : view === "action" ? needsAction : view === "schedule" ? live.filter((inst) => !inst.date)
    : view === "completed" ? all.filter((inst) => inst.status === "completed") : all)
    .filter((inst) => !query || `${inst.title} ${inst.customerName} ${inst.siteAddress} ${inst.quoteNumber} ${inst.invoiceNumber} ${inst.installers}`.toLowerCase().includes(query))
    .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999") || a.startTime.localeCompare(b.startTime));
  if (view === "completed") shown.reverse();
  const groups = new Map<string, Installation[]>();
  for (const inst of shown) groups.set(inst.date || "", [...(groups.get(inst.date || "") ?? []), inst]);
  const link = (next: Record<string, string>) => `/admin/installations?${new URLSearchParams(Object.fromEntries(Object.entries({ view, store: storeFilter, q, ...next }).filter(([, value]) => value)))}`;

  return <>
    <AdminNav admin={{ email: admin.email, role: admin.role, store: admin.store }} />
    <div className="admin-head"><div><h1>Installations</h1><p>{admin.role === "super" ? "All stores." : `${storeLabel(admin.store)} store.`} Outside jobs need a weather check before the lift is booked; the lift is booked before the installation is confirmed. Every morning the next day's jobs are re-checked and the staff are emailed.</p></div>
      {admin.role === "super" && <div className="admin-head-actions"><DayBeforeButton /></div>}</div>
    <div className="bill-stats">{stats.map(([label, value, detail]) => <div key={label}><span>{label}</span><b>{value}</b><small>{detail}</small></div>)}</div>
    <nav className="admin-filters-row" aria-label="Filter"><span>Show:</span>{tabs.map(([value, text]) => <Link key={value} href={link({ view: value })} aria-current={view === value ? "page" : undefined}>{text}{value === "action" && needsAction.length ? ` (${needsAction.length})` : ""}</Link>)}</nav>
    {admin.role === "super" && <nav className="admin-filters-row" aria-label="Filter by store"><span>Store:</span>{[["", "All stores"], ...stores.map((item) => [item.value, item.label])].map(([value, text]) => <Link key={value} href={link({ store: value })} aria-current={storeFilter === value ? "page" : undefined}>{text}</Link>)}</nav>}
    <form className="admin-filters" action="/admin/installations"><input type="hidden" name="view" value="all" />{storeFilter && <input type="hidden" name="store" value={storeFilter} />}<input name="q" defaultValue={q} placeholder="Search job, customer, site, installer or number" aria-label="Search" /><button className="button button-orange" type="submit">Search</button></form>
    {shown.length === 0 ? <div className="admin-card"><p>{all.length ? "Nothing here." : "No installations yet. Jobs with an installation line get one automatically when the quote is accepted."}</p></div>
      : [...groups].map(([date, items]) => <section key={date || "none"} className="inst-day">
        <h2>{date ? <>{dayLabel(date)}{date === today ? <span className="inst-today">Today</span> : ""}</> : "No date yet"}</h2>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Time</th><th>Job</th><th>Site</th>{admin.role === "super" && <th>Store</th>}<th>Weather</th><th>Lift</th><th>Installers</th><th>Status</th></tr></thead><tbody>
          {items.map((inst) => { const stage = installStage(inst), wx = weatherBadge(inst), next = installBlockers(inst)[0]; return <tr key={inst.id}>
            <td>{inst.startTime || "—"}{inst.days > 1 && <small>{inst.days} days</small>}</td>
            <td><Link href={`/admin/installations/${inst.id}`}><b>{inst.title || inst.customerName}</b></Link><small>{inst.customerName} · {[inst.quoteNumber, inst.invoiceNumber].filter(Boolean).join(" / ")}</small></td>
            <td>{inst.siteAddress || "—"}{inst.contactPhone && <small>{inst.contactPhone}</small>}</td>
            {admin.role === "super" && <td>{storeLabel(inst.store)}</td>}
            <td><span className={`inst-badge is-${wx.key}`}>{wx.label}</span></td>
            <td>{inst.liftRequired ? <><span className={`inst-badge is-${inst.lift.booked ? "good" : "todo"}`}>{inst.lift.booked ? "Booked" : "To book"}</span><small>{inst.liftType}{inst.lift.booked && inst.lift.supplier ? ` · ${inst.lift.supplier}` : ""}</small></> : <span className="inst-badge is-na">Not needed</span>}</td>
            <td>{inst.installers || "—"}</td>
            <td><span className={`inst-badge is-${stage.key}`}>{stage.label}</span>{inst.status === "pending" && next && <small>Next: {next.text.toLowerCase()}</small>}</td>
          </tr>; })}
        </tbody></table></div>
      </section>)}
  </>;
}
