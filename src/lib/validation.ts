export function isEmail(value: unknown): value is string { return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
export function isShortText(value: unknown, max = 500): value is string { return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max; }
export function asText(form: FormData, key: string): string { const value = form.get(key); return typeof value === "string" ? value.trim() : ""; }
export function formAttribution(form: FormData) { return Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "landing_page"].map((key) => [key, asText(form, key)])); }
