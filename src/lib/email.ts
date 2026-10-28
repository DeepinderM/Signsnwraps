import "server-only";
import { createHash } from "node:crypto";
import nodemailer, { type Transporter } from "nodemailer";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { bucket, db } from "@/lib/firebase/admin";
import { addEnquiryNote } from "@/lib/services/enquiries";

// Customer email conversations in the admin portal.
// - Outgoing: sent over SMTP from the shared mailbox; each email gets its own Message-ID and follow-ups
//   carry In-Reply-To/References, so the customer's mail app threads them.
// - Replies: customers reply to the shared mailbox; syncReplies() reads its inbox over IMAP and files each
//   reply against the right enquiry/order/user by matching those headers (fallback: sender + subject).
// Everything is stored in Firestore `emails` (direction "out" | "in").
//
// SMTP_HOST, SMTP_PORT (465 SSL | 587 STARTTLS), SMTP_USER, SMTP_PASS — the shared mailbox
// IMAP_HOST (default: derived from SMTP_HOST), IMAP_PORT (993), IMAP_USER/IMAP_PASS (default: SMTP ones)
// EMAIL_FROM e.g. "Signsnwraps <sale@signsnwraps.com.au>" (default SMTP_USER)
// Without SMTP settings in development, outgoing emails are printed to the server log instead.

export type EmailContext = { type: "enquiry" | "order" | "user" | "billing"; id: string };
export type EmailAttachment = { filename: string; content: Uint8Array; contentType: string };
export type ThreadMessage = {
  id: string; direction: "out" | "in"; from: string; fromName: string; to: string; subject: string;
  body: string; quoted: string; at: number; status: "sent" | "logged" | "failed" | "received"; error: string; sentBy: string; attachments: string[];
  /** Files from a customer's reply, saved to Storage; open them via /admin/emails/<id>/files/<index>. */
  files: EmailFile[];
};
export type EmailFile = { name: string; path: string; size: number; contentType: string };
type IncomingFile = { filename: string; contentType: string; content: Buffer };

// Limits for files saved from customer replies.
const MAX_REPLY_FILES = 15;
const MAX_REPLY_FILE_BYTES = 25 * 1024 * 1024;

const emails = () => db().collection("emails");

export function emailMode(): "smtp" | "log" | "off" {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return "smtp";
  return process.env.NODE_ENV === "production" ? "off" : "log";
}

const mailbox = () => (process.env.IMAP_USER || process.env.SMTP_USER || "").toLowerCase();
const fromAddress = () => process.env.EMAIL_FROM || process.env.SMTP_USER || "Signsnwraps <no-reply@localhost>";
const mailDomain = () => /@([^>\s]+)/.exec(fromAddress())?.[1] ?? "signsnwraps.local";

let transporter: Transporter | null = null;
function smtp() {
  const port = Number(process.env.SMTP_PORT || 465);
  transporter ??= nodemailer.createTransport({ host: process.env.SMTP_HOST, port, secure: port === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
  return transporter;
}

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

/** Simple branded HTML version of the plain-text message (links are made clickable). */
function renderHtml(body: string) {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://signsnwraps.vercel.app").replace(/\/$/, "");
  const paragraphs = escapeHtml(body).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#026BA3">$1</a>').split(/\n{2,}/).map((part) => `<p style="margin:0 0 14px">${part.replace(/\n/g, "<br>")}</p>`).join("");
  return `<!doctype html><html><body style="margin:0;background:#E3ECF6;font-family:Arial,Helvetica,sans-serif;color:#13233A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E3ECF6;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#13233A;padding:18px 24px"><img src="${site}/email/logo-white-blue.png" alt="Signsnwraps" height="36" style="display:block;height:36px"></td></tr>
<tr><td style="padding:28px 24px 12px;font-size:15px;line-height:1.6;color:#13233A">${paragraphs}</td></tr>
<tr><td style="padding:16px 24px 24px;font-size:12px;color:#4A5568;border-top:1px solid #E5E5E6">Signsnwraps · <a href="${site}" style="color:#026BA3">${site.replace(/^https?:\/\//, "")}</a><br>Reply to this email to get straight back to our team.</td></tr>
</table></td></tr></table></body></html>`;
}

const toMillis = (value: unknown) => (value instanceof Timestamp ? value.toMillis() : 0);

function toMessage(id: string, data: FirebaseFirestore.DocumentData): ThreadMessage {
  return {
    id, direction: data.direction === "in" ? "in" : "out", from: data.from ?? "", fromName: data.fromName ?? "", to: data.to ?? "", subject: data.subject ?? "",
    body: data.body ?? "", quoted: data.quoted ?? "", at: toMillis(data.at), status: data.status ?? "sent", error: data.error ?? "", sentBy: data.sentBy ?? "", attachments: Array.isArray(data.attachments) ? data.attachments : [],
    files: Array.isArray(data.files) ? data.files : [],
  };
}

async function threadDocs(context: EmailContext, address?: string) {
  const queries = [emails().where("context.type", "==", context.type).where("context.id", "==", context.id).limit(200).get()];
  // A person's page also shows mail to/from them that was filed against their enquiries and orders.
  if (address) queries.push(emails().where("to", "==", address).limit(200).get(), emails().where("from", "==", address).limit(200).get());
  const map = new Map<string, FirebaseFirestore.DocumentData>();
  for (const snapshot of await Promise.all(queries)) for (const doc of snapshot.docs) map.set(doc.id, doc.data());
  return [...map].sort(([, a], [, b]) => toMillis(a.at) - toMillis(b.at));
}

/** The conversation for an enquiry, order or user, oldest first. */
export async function getThread(context: EmailContext, address?: string): Promise<ThreadMessage[]> {
  return (await threadDocs(context, address?.toLowerCase())).map(([id, data]) => toMessage(id, data));
}

/** Sends an email to a customer as part of a conversation and logs it. */
export async function sendCustomerEmail(input: { to: string; subject: string; body: string; sentBy: { name: string; email: string }; context: EmailContext; attachments?: EmailAttachment[]; files?: EmailFile[] }): Promise<{ id: string } | { error: string }> {
  const mode = emailMode();
  if (mode === "off") return { error: "Email sending isn't set up yet. Add the SMTP settings in Vercel (see .env.example)." };
  const to = input.to.toLowerCase();
  const ref = emails().doc();
  const messageId = `<${ref.id}.${Date.now()}@${mailDomain()}>`;
  // Thread follow-ups onto the previous messages in this conversation.
  const previous = (await threadDocs(input.context)).map(([, data]) => data.messageId).filter((id): id is string => typeof id === "string" && id.length > 0);
  const threading = previous.length ? { inReplyTo: previous.at(-1), references: previous.slice(-20) } : {};
  let status: ThreadMessage["status"] = "sent";
  let error = "";
  try {
    if (mode === "smtp") {
      await smtp().sendMail({ from: fromAddress(), to, subject: input.subject, text: input.body, html: renderHtml(input.body), messageId, ...threading, attachments: input.attachments?.map((item) => ({ filename: item.filename, content: Buffer.from(item.content), contentType: item.contentType })) });
    } else {
      status = "logged";
      console.info(`[email:dev] To: ${to} | Subject: ${input.subject}${input.attachments?.length ? ` | Attachments: ${input.attachments.map((item) => `${item.filename} (${item.content.length} bytes)`).join(", ")}` : ""}\n${input.body}`);
    }
  } catch (reason) {
    status = "failed";
    error = reason instanceof Error ? reason.message.slice(0, 300) : "Unknown error";
    console.error("Customer email failed", reason);
  }
  await ref.set({ direction: "out", from: mailbox(), to, subject: input.subject, body: input.body, messageId, sentBy: input.sentBy.name || input.sentBy.email, sentByEmail: input.sentBy.email, status, error, attachments: input.attachments?.map((item) => item.filename) ?? [], files: input.files ?? [], context: input.context, at: FieldValue.serverTimestamp() });
  return status === "failed" ? { error: `The email couldn't be sent: ${error}` } : { id: ref.id };
}

/** Splits a reply into the new text and the quoted earlier message underneath it. */
export function splitQuoted(text: string) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const startsQuote = (line: string, index: number) => {
    const trimmed = line.trim();
    if (/^>/.test(trimmed)) return true;                                          // > quoted lines
    if (/^On .{4,200}wrote:$/.test(trimmed)) return true;                         // Gmail / Apple Mail
    if (/^On .{4,200}$/.test(trimmed) && /wrote:$/.test((lines[index + 1] ?? "").trim())) return true; // wrapped "On … wrote:"
    if (/^-{2,}\s*Original Message\s*-{2,}$/i.test(trimmed)) return true;           // older Outlook
    return /^From: .+/.test(trimmed) && /^(Sent|Date): /m.test(lines.slice(index + 1, index + 4).join("\n")); // Outlook header block
  };
  const cut = lines.findIndex(startsQuote);
  if (cut <= 0) return { body: text.trim(), quoted: "" };
  return { body: lines.slice(0, cut).join("\n").trim(), quoted: lines.slice(cut).join("\n").trim() };
}

const normaliseSubject = (subject: string) => subject.replace(/^((re|fw|fwd|aw)\s*:\s*)+/i, "").trim().toLowerCase();
const imapHost = () => process.env.IMAP_HOST || (process.env.SMTP_HOST ?? "").replace(/^smtp\.gmail\.com$/, "imap.gmail.com").replace(/^smtp\.office365\.com$/, "outlook.office365.com").replace(/^smtp\./, "imap.");

/** Files one incoming email against its conversation. Returns true when it was new and matched. */
/** Saves a reply's attachments to Storage (emails/<id>/…) and returns what was stored. */
async function storeReplyFiles(id: string, files: IncomingFile[]): Promise<EmailFile[]> {
  const stored: EmailFile[] = [];
  for (const [index, file] of files.slice(0, MAX_REPLY_FILES).entries()) {
    if (!file.content.length || file.content.length > MAX_REPLY_FILE_BYTES) continue;
    const name = (file.filename || `attachment-${index + 1}`).replace(/[\/\\]+/g, "_").slice(0, 140);
    const path = `emails/${id}/${index}-${name.replace(/[^A-Za-z0-9._-]+/g, "_")}`;
    try {
      await bucket().file(path).save(file.content, { contentType: file.contentType || "application/octet-stream", resumable: false });
      stored.push({ name, path, size: file.content.length, contentType: file.contentType || "application/octet-stream" });
    } catch (reason) {
      console.error("Couldn't save reply attachment", name, reason);
    }
  }
  return stored;
}

export async function fileIncoming(mail: { messageId: string; inReplyTo: string; references: string[]; from: string; fromName: string; subject: string; text: string; date: Date; files?: IncomingFile[] }) {
  const from = mail.from.toLowerCase();
  if (!from || from === mailbox()) return false;
  const candidates = [mail.inReplyTo, ...mail.references].filter(Boolean).slice(-30);
  let match: FirebaseFirestore.DocumentData | undefined;
  if (candidates.length) match = (await emails().where("messageId", "in", candidates).limit(1).get()).docs[0]?.data();
  if (!match) {
    // Fallback for mail apps that drop the headers: same customer and same subject as something we sent.
    const sent = await emails().where("to", "==", from).limit(50).get();
    match = sent.docs.map((doc) => doc.data()).filter((data) => data.direction !== "in" && normaliseSubject(data.subject ?? "") === normaliseSubject(mail.subject)).sort((a, b) => toMillis(b.at) - toMillis(a.at))[0];
  }
  if (!match?.context) return false;
  const id = createHash("sha1").update(mail.messageId || `${from}|${mail.subject}|${mail.date.toISOString()}`).digest("hex").slice(0, 32);
  const { body, quoted } = splitQuoted(mail.text);
  const files = mail.files ?? [];
  try {
    await emails().doc(id).create({ direction: "in", from, fromName: mail.fromName, to: mailbox(), subject: mail.subject, body: body.slice(0, 20000), quoted: quoted.slice(0, 20000), messageId: mail.messageId, inReplyTo: mail.inReplyTo, status: "received", context: match.context, at: Timestamp.fromDate(mail.date), attachments: files.map((file) => file.filename), files: [] });
  } catch {
    // Already filed. Replies filed before attachments were saved get their files now.
    const existing = await emails().doc(id).get();
    if (files.length && existing.exists && !(existing.get("files") ?? []).length) {
      const stored = await storeReplyFiles(id, files);
      if (stored.length) await emails().doc(id).update({ files: stored, attachments: stored.map((file) => file.name) });
    }
    return false;
  }
  if (files.length) {
    const stored = await storeReplyFiles(id, files);
    await emails().doc(id).update({ files: stored, attachments: stored.map((file) => file.name) });
  }
  if (match.context.type === "enquiry") await addEnquiryNote(match.context.id, `Customer replied: “${mail.subject}”`, mail.fromName || from, "email").catch(() => undefined);
  return true;
}

/**
 * Reads recent mail from the shared inbox and files customer replies. Throttled to once every
 * 30 seconds across all staff (unless forced) so opening pages stays fast.
 */
export async function syncReplies({ force = false } = {}): Promise<{ added: number; skipped?: boolean } | { error: string }> {
  if (emailMode() !== "smtp") return { added: 0, skipped: true };
  const state = db().collection("system").doc("emailSync");
  const last = toMillis((await state.get()).get("lastRun"));
  if (!force && Date.now() - last < 30_000) return { added: 0, skipped: true };
  await state.set({ lastRun: FieldValue.serverTimestamp() }, { merge: true });
  const client = new ImapFlow({ host: imapHost(), port: Number(process.env.IMAP_PORT || 993), secure: true, auth: { user: process.env.IMAP_USER || process.env.SMTP_USER!, pass: process.env.IMAP_PASS || process.env.SMTP_PASS! }, logger: false });
  let added = 0;
  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const since = new Date((last || Date.now() - 30 * 864e5) - 2 * 864e5);
      const found = await client.search({ since }, { uid: true });
      const uids = (Array.isArray(found) ? found : []).slice(-200);
      if (uids.length) {
        for await (const message of client.fetch(uids, { source: true }, { uid: true })) {
          if (!message.source) continue;
          const parsed = await simpleParser(message.source);
          const sender = parsed.from?.value[0];
          const references = Array.isArray(parsed.references) ? parsed.references : parsed.references ? [parsed.references] : [];
          const text = parsed.text || (typeof parsed.html === "string" ? parsed.html.replace(/<[^>]+>/g, " ") : "");
          // Real attachments only: small images embedded in the HTML (signature logos, icons) are skipped.
          const files = parsed.attachments.filter((item) => !(item.related && item.size < 200 * 1024)).map((item) => ({ filename: item.filename ?? "", contentType: item.contentType, content: item.content }));
          if (await fileIncoming({ messageId: parsed.messageId ?? "", inReplyTo: parsed.inReplyTo ?? "", references, from: sender?.address ?? "", fromName: sender?.name ?? "", subject: parsed.subject ?? "", text, date: parsed.date ?? new Date(), files })) added += 1;
        }
      }
    } finally {
      lock.release();
    }
    await client.logout();
  } catch (reason) {
    console.error("Reply sync failed", reason);
    await client.logout().catch(() => undefined);
    return { error: "Couldn't check the inbox for replies. Check the IMAP settings." };
  }
  return { added };
}
