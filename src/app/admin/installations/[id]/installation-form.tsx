"use client";

import { useActionState } from "react";
import { installBlockers, LIFT_TYPES, verdictLabel, weatherCleared, weatherKey, type Installation } from "@/lib/installation-types";
import { installationAction, resendInstallationEmail } from "../actions";

const day = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
const stamp = (ms: number) => new Date(ms).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });

/** The installation steps in order: schedule → weather (outside) → lift (if needed) → confirm. Later steps unlock as earlier ones are done. */
export function InstallationForm({ inst, today }: { inst: Installation; today: string }) {
  const [actionState, act, busy] = useActionState(installationAction, null);
  const [resendState, resend, resending] = useActionState(resendInstallationEmail, null);
  const state = [actionState, resendState].filter(Boolean).sort((a, b) => (b!.at ?? 0) - (a!.at ?? 0))[0];
  const closed = inst.status === "completed" || inst.status === "cancelled";
  const blockers = installBlockers(inst);
  const weatherCurrent = !!inst.weather && inst.weather.checkedFor === weatherKey(inst);
  const cleared = weatherCleared(inst);
  const hidden = (op: string) => <><input type="hidden" name="id" value={inst.id} /><input type="hidden" name="op" value={op} /></>;

  return <div className="inst-steps">
    {state?.error && <p className="admin-error" role="alert">{state.error}</p>}
    {state?.ok && <p className="admin-ok" role="status">{state.ok}</p>}

    <section className="admin-card inst-step">
      <h2><span className="inst-num">1</span> Schedule</h2>
      <form action={act} className="inst-grid">
        {hidden("save")}
        <div className="field"><label htmlFor="i-date">Installation date</label><input id="i-date" type="date" name="date" defaultValue={inst.date} min={today} disabled={closed} /></div>
        <div className="field"><label htmlFor="i-time">Start time</label><input id="i-time" type="time" name="startTime" defaultValue={inst.startTime} disabled={closed} /></div>
        <div className="field"><label htmlFor="i-days">Days on site</label><input id="i-days" type="number" name="days" min={1} max={30} defaultValue={inst.days} disabled={closed} /></div>
        <fieldset className="field inst-where"><legend className="ls-label">Where is the sign going?</legend>
          <label><input type="radio" name="location" value="outside" defaultChecked={inst.location === "outside"} disabled={closed} /> Outside <small>weather check needed</small></label>
          <label><input type="radio" name="location" value="inside" defaultChecked={inst.location === "inside"} disabled={closed} /> Inside</label></fieldset>
        <div className="field inst-wide"><label htmlFor="i-site">Site address</label><input id="i-site" name="siteAddress" defaultValue={inst.siteAddress} placeholder="12 Example St, Laverton North VIC 3026" disabled={closed} /><small>Include the suburb, state and postcode so the forecast is for the right place.</small></div>
        <div className="field"><label htmlFor="i-phone">Site contact phone</label><input id="i-phone" name="contactPhone" defaultValue={inst.contactPhone} disabled={closed} /></div>
        <div className="field"><label htmlFor="i-crew">Installers</label><input id="i-crew" name="installers" defaultValue={inst.installers} placeholder="e.g. Jas + Mike" disabled={closed} /></div>
        <div className="field inst-lift-need"><label><input type="checkbox" name="liftRequired" defaultChecked={inst.liftRequired} disabled={closed} /> A lift / access equipment is needed</label>
          <select name="liftType" defaultValue={inst.liftType || LIFT_TYPES[0]} disabled={closed} aria-label="Lift type">{LIFT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>
        <div className="field inst-wide"><label htmlFor="i-notes">Notes for the crew</label><textarea id="i-notes" name="notes" rows={3} defaultValue={inst.notes} placeholder="Access, parking, power, height, fixings…" disabled={closed} /></div>
        {!closed && <button className="button button-orange" type="submit" disabled={busy}>{busy ? "Saving…" : "Save schedule"}</button>}
      </form>
      <small className="admin-hint">Changing the date, number of days, site or inside/outside clears the weather check{inst.status === "confirmed" ? " and puts the job back to pending" : ""}.</small>
    </section>

    <section className={`admin-card inst-step${inst.location !== "outside" ? " is-skipped" : ""}`}>
      <h2><span className="inst-num">2</span> Weather check {inst.location === "outside" && <span className={`inst-badge is-${cleared ? (inst.weather?.override ? "caution" : inst.weather?.verdict) : weatherCurrent ? inst.weather!.verdict : "todo"}`}>{cleared ? inst.weather?.override ? "Overridden" : verdictLabel[inst.weather!.verdict] : weatherCurrent ? verdictLabel[inst.weather!.verdict] : "Not checked"}</span>}</h2>
      {inst.location === "inside" ? <p className="admin-hint">Inside job: no weather check needed.</p>
        : inst.location !== "outside" ? <p className="admin-hint">Choose inside or outside in step 1.</p>
        : !inst.date ? <p className="admin-hint">Set the installation date first.</p>
        : <>
          {weatherCurrent && inst.weather && <>
            <p className="admin-hint">Forecast for {inst.weather.place} · checked {stamp(inst.weather.checkedAt)} by {inst.weather.by}. Check again the day before to be sure.</p>
            <div className="admin-table-wrap"><table className="admin-table inst-weather"><thead><tr><th>Day</th><th>Rain</th><th>Wind gusts</th><th>Max temp</th><th>Verdict</th></tr></thead><tbody>
              {inst.weather.days.map((item) => <tr key={item.date} className={`is-${item.verdict}`}><td>{day(item.date)}</td>{item.verdict === "unavailable" ? <td colSpan={3}>{item.reasons.join(" ")}</td> : <><td>{item.rainChance}% · {item.rainMm} mm</td><td>{Math.round(item.gustKmh)} km/h</td><td>{Math.round(item.tempMax)}°C</td></>}<td><b>{verdictLabel[item.verdict]}</b>{item.verdict !== "unavailable" && item.reasons.length > 0 && <small>{item.reasons.join(" · ")}</small>}</td></tr>)}
            </tbody></table></div>
            {inst.weather.override && <p className="inst-override">Override: {inst.weather.override}</p>}
          </>}
          {inst.weather && !weatherCurrent && <p className="admin-error">The last check was for different dates. Check again for {day(inst.date)}{inst.days > 1 ? ` + ${inst.days - 1} day${inst.days > 2 ? "s" : ""}` : ""}.</p>}
          {!closed && <form action={act}>{hidden("weather")}<button className="button button-orange" type="submit" disabled={busy}>{weatherCurrent ? "Check again" : "Check the weather"}</button></form>}
          {!closed && weatherCurrent && !cleared && <form action={act} className="inst-override-form">{hidden("override")}
            <p>{inst.weather?.verdict === "unavailable" ? "The forecast isn't out yet for these dates. To book the lift now, say how the weather was checked (and check again closer to the day)." : "The forecast isn't suitable for lift work. Move the date, or go ahead only with a reason."}</p>
            <input name="reason" placeholder="e.g. Checked BOM long-range outlook; will re-check 2 days before" maxLength={500} /><button className="button button-light" type="submit" disabled={busy}>Go ahead anyway</button></form>}
        </>}
    </section>

    <section className={`admin-card inst-step${!inst.liftRequired ? " is-skipped" : ""}`}>
      <h2><span className="inst-num">3</span> Lift booking {inst.liftRequired && <span className={`inst-badge is-${inst.lift.booked ? "good" : "todo"}`}>{inst.lift.booked ? "Booked" : "Not booked"}</span>}</h2>
      {!inst.liftRequired ? <p className="admin-hint">No lift needed. Tick "A lift / access equipment is needed" in step 1 if that changes.</p>
        : inst.lift.booked ? <>
          <dl className="inst-dl"><div><dt>Type</dt><dd>{inst.liftType || "-"}</dd></div><div><dt>Supplier</dt><dd>{inst.lift.supplier}</dd></div><div><dt>Booking ref</dt><dd>{inst.lift.reference || "-"}</dd></div><div><dt>Lift date</dt><dd>{inst.lift.date ? day(inst.lift.date) : "-"}</dd></div><div><dt>Cost</dt><dd>{inst.lift.cost || "-"}</dd></div><div><dt>Booked by</dt><dd>{inst.lift.bookedBy} · {stamp(inst.lift.bookedAt)}</dd></div></dl>
          {inst.date && inst.lift.date > inst.date && <p className="admin-error">The lift is booked for after the installation date. Cancel and rebook it.</p>}
          {inst.date && inst.lift.date && inst.lift.date < inst.date && <p className="inst-override">The lift is booked for {day(inst.lift.date)} but the installation is {day(inst.date)}. Check the hire covers the installation day, or rebook it.</p>}
          {!closed && <form action={act}>{hidden("unlift")}<button className="button button-light" type="submit" disabled={busy}>Cancel lift booking</button></form>}
        </>
        : !inst.date || !inst.location ? <p className="admin-hint">Set the date and inside/outside first.</p>
        : !cleared ? <p className="admin-error">Outside job: the weather check has to pass (or be overridden with a reason) before the lift is booked.</p>
        : !closed && <form action={act} className="inst-grid">{hidden("lift")}
          <div className="field"><label htmlFor="l-sup">Lift supplier</label><input id="l-sup" name="supplier" required placeholder="e.g. Kennards Hire Laverton" /></div>
          <div className="field"><label htmlFor="l-ref">Booking reference</label><input id="l-ref" name="reference" /></div>
          <div className="field"><label htmlFor="l-date">Lift date</label><input id="l-date" type="date" name="liftDate" defaultValue={inst.date} max={inst.date} /></div>
          <div className="field"><label htmlFor="l-cost">Cost (optional)</label><input id="l-cost" name="cost" placeholder="$450 + GST" /></div>
          <button className="button button-orange" type="submit" disabled={busy}>Record lift booking</button></form>}
    </section>

    <section className="admin-card inst-step">
      <h2><span className="inst-num">4</span> Confirm installation</h2>
      {inst.status === "completed" ? <p className="admin-ok">Installed{inst.completedAt ? ` · ${stamp(inst.completedAt)}` : ""}.</p>
        : inst.status === "cancelled" ? <p className="admin-hint">This installation was cancelled.</p>
        : inst.status === "confirmed" ? <p className="admin-ok">Confirmed for {day(inst.date)}{inst.startTime ? ` at ${inst.startTime}` : ""}{inst.days > 1 ? ` (${inst.days} days)` : ""}.</p>
        : blockers.length ? <><p className="admin-hint">Still to do before the date can be confirmed:</p><ol className="inst-todo">{blockers.map((step) => <li key={step.key}>{step.text}</li>)}</ol></>
        : <p className="admin-hint">All checks done. Confirm the installation to lock in the date.</p>}
      <div className="inst-actions">
        {inst.status === "pending" && <form action={act} className="inst-confirm">{hidden("confirm")}<button className="button button-orange" type="submit" disabled={busy || blockers.length > 0}>Confirm installation</button>
          <label><input type="checkbox" name="notify" defaultChecked /> Email the customer the booking</label></form>}
        {inst.status === "confirmed" && <form action={resend}><input type="hidden" name="id" value={inst.id} /><button className="button button-light" type="submit" disabled={resending}>{resending ? "Sending…" : "Email the booking to the customer again"}</button></form>}
        {inst.status === "confirmed" && <form action={act}>{hidden("complete")}<button className="button button-orange" type="submit" disabled={busy}>Mark as installed</button></form>}
        {!closed && <form action={act}>{hidden("cancel")}<button className="button button-light" type="submit" disabled={busy}>Cancel installation</button></form>}
        {closed && <form action={act}>{hidden("reopen")}<button className="button button-light" type="submit" disabled={busy}>Reopen</button></form>}
      </div>
    </section>
  </div>;
}
