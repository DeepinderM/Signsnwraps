"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { vehicleMakes } from "@/lib/data/wraps";

export function FitmentFinder({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [makeSlug, setMakeSlug] = useState("");
  const [modelSlug, setModelSlug] = useState("");
  const [year, setYear] = useState("");
  const selectedMake = vehicleMakes.find((make) => make.slug === makeSlug);
  const models = useMemo(() => selectedMake?.models.filter((model) => !body || model.body === body) ?? [], [selectedMake, body]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!makeSlug || !modelSlug || !year) return;
    router.push(`/wraps/kits/${makeSlug}/${modelSlug}-${year}`);
  }

  function changeBody(value: string) { setBody(value); setMakeSlug(""); setModelSlug(""); setYear(""); }
  function changeMake(value: string) { setMakeSlug(value); setModelSlug(""); setYear(""); }

  return <form className={`fitment-finder${compact ? " is-compact" : ""}`} onSubmit={submit}>
    {!compact && <div className="finder-heading"><span className="finder-number">01</span><div><strong>Find a kit for your vehicle</strong><small>Choose a body type, make, model and year to check the pattern list.</small></div></div>}
    <div className="finder-fields">
      <label><span>Vehicle type</span><select value={body} onChange={(event) => changeBody(event.target.value)} required><option value="">Choose type</option>{["Car", "Ute", "4WD", "SUV"].map((type) => <option key={type}>{type}</option>)}</select></label>
      <label><span>Make</span><select value={makeSlug} onChange={(event) => changeMake(event.target.value)} required disabled={!body}><option value="">Choose make</option>{vehicleMakes.filter((make) => make.models.some((model) => !body || model.body === body)).map((make) => <option value={make.slug} key={make.slug}>{make.name}</option>)}</select></label>
      <label><span>Model</span><select value={modelSlug} onChange={(event) => {setModelSlug(event.target.value);setYear("");}} required disabled={!makeSlug}><option value="">Choose model</option>{models.map((model) => <option value={model.slug} key={model.slug}>{model.name}</option>)}</select></label>
      <label><span>Year</span><select value={year} onChange={(event) => setYear(event.target.value)} required disabled={!modelSlug}><option value="">Choose year</option>{models.find(model=>model.slug===modelSlug)?.years.map((item)=><option value={item} key={item}>{item}</option>)}</select></label>
      <button className="button button-orange finder-submit" type="submit" disabled={!makeSlug || !modelSlug || !year}>Find my kit</button>
    </div>
    <style>{`.fitment-finder{background:#fff;color:#000;padding:24px}.finder-heading{display:flex;align-items:flex-start;gap:13px;margin-bottom:20px}.finder-number{color:#000;background:var(--electric-blue);font-size:10px;font-weight:800;padding:6px 8px}.finder-heading div{display:grid;gap:6px}.finder-heading strong{font-size:16px}.finder-heading small{font-size:11px;color:#606060;line-height:1.5}.finder-fields{display:grid;grid-template-columns:repeat(4,minmax(0,1fr)) auto;gap:11px;align-items:end}.finder-fields label{display:grid;gap:7px}.finder-fields label>span{font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:700}.finder-fields select{height:48px;border:1px solid #ccc;background:#fff;padding:0 11px;color:#000;min-width:0}.finder-fields select:disabled{background:#f5f5f5;color:#888}.finder-submit{min-height:48px;padding:0 16px;font-size:11px;white-space:nowrap}.finder-submit:disabled{opacity:.45}.fitment-finder.is-compact{padding:18px}.fitment-finder.is-compact .finder-fields{grid-template-columns:repeat(4,minmax(0,1fr)) auto}@media(max-width:900px){.finder-fields,.fitment-finder.is-compact .finder-fields{grid-template-columns:1fr 1fr}.finder-submit{grid-column:1/-1;width:100%}}@media(max-width:420px){.finder-fields,.fitment-finder.is-compact .finder-fields{grid-template-columns:1fr}}`}</style>
  </form>;
}
