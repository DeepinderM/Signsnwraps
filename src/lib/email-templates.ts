export type EmailTemplate = { label: string; subject: string; body: string };

// Starting points for staff emails. Everything is editable before sending.

const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";
const signOff = (staff: string) => `\n\nKind regards,\n${staff}\nSignsnwraps`;

export function enquiryTemplates(input: { name: string; service: string; type: string; date?: string; time?: string; staff: string }): EmailTemplate[] {
  const hi = `Hi ${firstName(input.name)},\n\n`;
  const end = signOff(input.staff);
  return [
    { label: "Follow up", subject: `Your ${input.service} enquiry with Signsnwraps`, body: `${hi}Thanks for getting in touch about ${input.service.toLowerCase()}. I'd love to learn a bit more about your project so we can help.\n\nWhen's a good time for a quick call?${end}` },
    ...(input.type === "booking" ? [{ label: "Confirm appointment", subject: `Your Signsnwraps consultation is confirmed`, body: `${hi}Your ${input.service.toLowerCase()} consultation is confirmed for ${input.date ?? "[date]"} at ${input.time ?? "[time]"}.\n\nIf anything changes, just reply to this email.${end}` }] : []),
    { label: "Quote ready", subject: `Your Signsnwraps quote: ${input.service}`, body: `${hi}Thanks for your patience. Here's your quote for ${input.service.toLowerCase()}:\n\n[Quote details and price]\n\nThis quote is valid for 30 days. Reply to this email to go ahead or ask any questions.${end}` },
    { label: "Need details", subject: `A few details for your ${input.service} enquiry`, body: `${hi}To prepare an accurate quote, could you please send:\n\n- Photos of the vehicle or site\n- Approximate sizes\n- Your preferred timeframe\n\nJust reply to this email with the details.${end}` },
    ...(input.type === "installer" ? [{ label: "Installer reply", subject: "Your Signsnwraps installer application", body: `${hi}Thanks for applying to join the Signsnwraps installer network. We've reviewed your application and would like to have a chat about next steps.\n\nWhen suits you for a call this week?${end}` }] : []),
  ];
}

export function orderTemplates(input: { name: string; orderNumber: string; delivery: string; tracking: string; staff: string }): EmailTemplate[] {
  const hi = `Hi ${firstName(input.name)},\n\n`;
  const end = signOff(input.staff);
  return [
    { label: "Order update", subject: `Update on your Signsnwraps order ${input.orderNumber}`, body: `${hi}A quick update on your order ${input.orderNumber}:\n\n[Update]${end}` },
    input.delivery === "pickup"
      ? { label: "Ready to collect", subject: `Order ${input.orderNumber} is ready to collect`, body: `${hi}Good news: your order ${input.orderNumber} is ready to collect from our studio.\n\nPlease bring your order number when you visit.${end}` }
      : { label: "Shipped", subject: `Order ${input.orderNumber} has shipped`, body: `${hi}Your order ${input.orderNumber} is on its way.${input.tracking ? `\n\nTracking number: ${input.tracking}` : ""}\n\nDelivery usually takes 2–5 business days depending on your location.${end}` },
  ];
}

export function userTemplates(input: { name: string; staff: string }): EmailTemplate[] {
  return [{ label: "Message", subject: "A message from Signsnwraps", body: `Hi ${firstName(input.name)},\n\n${signOff(input.staff).trimStart()}` }];
}

type StageInfo = { label: string; percent: number; amount: string; when: string };

/** "Deposit (50%): $1,073.05 · before production" lines for an email. */
const scheduleLines = (schedule: StageInfo[]) => schedule.map((stage) => `- ${stage.label}${stage.percent < 100 ? ` (${stage.percent}%)` : ""}: ${stage.amount} · ${stage.when.toLowerCase()}`).join("\n");

export function billingTemplates(input: { kind: "quote" | "invoice"; number: string; name: string; title: string; total: string; due: string; link: string; staff: string; bank: string; schedule: StageInfo[]; dueStage: { label: string; percent: number; amount: string } | null }): EmailTemplate[] {
  const hi = `Hi ${firstName(input.name)},\n\n`;
  const end = signOff(input.staff);
  const what = input.title ? ` for ${input.title}` : "";
  const staged = input.schedule.length > 1;
  const terms = staged ? `Payment terms:\n${scheduleLines(input.schedule)}` : `Payment is due in full before work starts.`;
  if (input.kind === "quote") return [
    { label: "Send quote", subject: `Quote ${input.number}${what} from Signsnwraps`, body: `${hi}Thanks for the opportunity to quote${what}. Your quote ${input.number} is attached (total ${input.total} incl. GST, valid until ${input.due}).\n\n${terms}\n\nYou can view and accept it online here:\n${input.link}\n\nHappy to answer any questions. Just reply to this email.${end}` },
    { label: "Quote follow-up", subject: `Following up on quote ${input.number}`, body: `${hi}Just checking in on quote ${input.number}${what}. It's valid until ${input.due}.\n\nView or accept it here:\n${input.link}\n\nLet me know if you'd like any changes.${end}` },
  ];
  const payNow = input.dueStage ? `${input.dueStage.label}${input.dueStage.percent < 100 ? ` (${input.dueStage.percent}%)` : ""}: ${input.dueStage.amount}` : "";
  const howToPay = `${input.bank ? `${input.bank}\n\n` : ""}Or pay online by card, Apple Pay or Google Pay:\n${input.link}`;
  return [
    { label: "Send invoice", subject: `Invoice ${input.number} from Signsnwraps`, body: `${hi}Please find attached invoice ${input.number}${what} for ${input.total} (incl. GST).\n\n${staged ? `${terms}\n\nTo get started, the ${payNow ? payNow.toLowerCase() : "deposit"} is due now, before we begin production.` : `Payment of ${input.total} is due by ${input.due}.`}\n\n${howToPay}\n\nThank you for your business.${end}` },
    ...(staged ? [
      { label: "Installation payment", subject: `Invoice ${input.number}: progress payment before installation`, body: `${hi}Great news: your job${what} is ready for installation. As per our payment terms, the progress payment is now due:\n\n${payNow || "Progress payment (30%)"}\n\nOnce it's received we'll lock in your installation date.\n\n${howToPay}${end}` },
      { label: "Final payment", subject: `Invoice ${input.number}: final payment`, body: `${hi}Your project${what} is complete. Thank you for choosing Signsnwraps! The final payment is now due:\n\n${payNow || "Final payment (20%)"}\n\n${howToPay}${end}` },
    ] : []),
    { label: "Payment reminder", subject: `Reminder: payment due on invoice ${input.number}`, body: `${hi}A friendly reminder that a payment is due on invoice ${input.number}${payNow ? `:\n\n${payNow}` : "."}\n\n${howToPay}\n\nIf you've already paid, thank you and please ignore this email.${end}` },
    { label: "Payment received", subject: `Payment received: invoice ${input.number}`, body: `${hi}Thanks, we've received your payment for invoice ${input.number}.${end}` },
  ];
}
