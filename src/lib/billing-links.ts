/** Customer-facing link for a quote or invoice (unguessable token, no sign-in needed). */
export function billingViewUrl(token: string) {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002").replace(/\/$/, "");
  return `${site}/billing/${token}`;
}
