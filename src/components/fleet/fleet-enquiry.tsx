"use client";

import { useSyncExternalStore } from "react";
import { BookingWizard, QuoteForm } from "@/components/forms/intake-forms";
import type { FleetWorkType } from "@/lib/data/fleet";

// The two tabs are plain links (#fleet-book / #fleet-quote), so the hero buttons can open either one directly.
const subscribe = (onChange: () => void) => { window.addEventListener("hashchange", onChange); return () => window.removeEventListener("hashchange", onChange); };

export function FleetEnquiry({ service, workTypes, workTypesLegend }: { service: string; workTypes: readonly FleetWorkType[]; workTypesLegend: string }) {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => "");
  const tab = hash === "#fleet-quote" ? "quote" : "book";
  return <div className="fleet-enquiry">
    <nav className="fleet-tabs" aria-label="Choose how to get started">
      <a href="#fleet-book" aria-current={tab === "book" ? "true" : undefined}><b>Book an appointment</b><span>Talk it through with our team in Laverton North</span></a>
      <a href="#fleet-quote" aria-current={tab === "quote" ? "true" : undefined}><b>Get a quotation</b><span>Send your fleet details and we'll price it up</span></a>
    </nav>
    <div className="fleet-form">{tab === "book" ? <BookingWizard defaultService={service} /> : <QuoteForm defaultService={service} fleet={{ workTypes, legend: workTypesLegend }} />}</div>
  </div>;
}
