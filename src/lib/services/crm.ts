export type Attribution = { utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string; utm_term?: string; landing_page?: string };
export type LeadPayload = { name: string; business?: string; email: string; phone: string; service: string; location: string; description: string; attribution?: Attribution };

export class IntegrationNotConfiguredError extends Error {
  constructor() { super("Lead delivery is not configured. Connect an approved CRM or notification provider before accepting submissions."); this.name = "IntegrationNotConfiguredError"; }
}

export async function createCrmLead(_lead: LeadPayload): Promise<{ id: string }> {
  // Replace with authenticated server-side Odoo 18, CRM, or webhook integration. Never expose credentials to the browser.
  void _lead; // payload will be sent to the CRM provider after configuration
  throw new IntegrationNotConfiguredError();
}
