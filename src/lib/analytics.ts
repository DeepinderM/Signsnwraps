export type TrackingEvent = "consultation_start" | "consultation_submit" | "quote_submit" | "phone_click" | "email_click";
export function trackEvent(event: TrackingEvent, detail?: Record<string, string>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("signsnwraps:track", { detail: { event, ...detail } }));
  const layer = (window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer;
  layer?.push({ event, ...detail });
}
