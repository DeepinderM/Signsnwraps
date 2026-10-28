"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { Download, Paperclip, RefreshCw, Reply, Send } from "lucide-react";
import { formatBytes as formatSize } from "@/lib/uploads";
import { checkReplies, sendEmail } from "./email-actions";
import type { EmailTemplate } from "@/lib/email-templates";
import type { ThreadMessage } from "@/lib/email";

const dateFormat = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Australia/Melbourne" });
const reSubject = (subject: string) => (/^re:/i.test(subject) ? subject : `Re: ${subject}`);

type Props = { to: string; name: string; contextType: "enquiry" | "order" | "user" | "billing"; contextId: string; templates: EmailTemplate[]; thread: ThreadMessage[]; mode: "smtp" | "log" | "off"; attachLabel?: string };

/**
 * One email conversation with the customer: everything sent and every reply, oldest first, with the
 * reply box underneath. Replies are pulled from the shared inbox when the page opens and on demand.
 */
export function EmailThread({ to, name, contextType, contextId, templates, thread, mode, attachLabel }: Props) {
  const [sendState, send, sending] = useActionState(sendEmail, null);
  const [syncState, sync, syncing] = useActionState(checkReplies, null);
  const last = thread.at(-1);
  const blank = { label: "Blank", subject: last ? reSubject(last.subject) : templates[0]?.subject ?? "", body: templates[0]?.body.replace(/\n\n[\s\S]*?\n\nKind regards/, "\n\n\n\nKind regards") ?? "" };
  const [template, setTemplate] = useState(thread.length ? "Blank" : templates[0]?.label ?? "Blank");
  const chosen = template === "Blank" ? blank : templates.find((item) => item.label === template) ?? blank;
  const [subject, setSubject] = useState(chosen.subject);
  const [body, setBody] = useState(chosen.body);
  const [sentAt, setSentAt] = useState<number | undefined>();
  // Reset the reply box after a successful send (adjusting state during render, per the React docs).
  if (sendState?.sentAt && sendState.sentAt !== sentAt) { setSentAt(sendState.sentAt); setTemplate("Blank"); setSubject(reSubject(subject)); setBody(blank.body); }

  // Keep the newest message in view, like a chat.
  const threadRef = useRef<HTMLOListElement>(null);
  useEffect(() => { threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight }); }, [thread.length]);

  // Look for new replies whenever the conversation is opened.
  useEffect(() => { if (mode === "smtp") startTransition(() => sync(false)); }, [mode, sync]);

  function pickTemplate(label: string) {
    const next = label === "Blank" ? blank : templates.find((item) => item.label === label) ?? blank;
    setTemplate(label); setSubject(next.subject); setBody(next.body);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => send(form));
  }

  return <div className="mail">
    <div className="mail-head">
      <div><b>{name || to}</b><small>{to} · {thread.length} {thread.length === 1 ? "message" : "messages"}</small></div>
      {mode === "smtp" && <button type="button" className="mail-sync" onClick={() => startTransition(() => sync(true))} disabled={syncing} aria-label="Check for replies"><RefreshCw aria-hidden className={syncing ? "is-spinning" : ""} /> {syncing ? "Checking…" : "Check for replies"}</button>}
    </div>
    {mode === "off" && <p className="admin-error">Email isn't set up yet. Add the mailbox settings in Vercel to send and receive here.</p>}
    {mode === "log" && <p className="mail-note">Development mode: emails are written to the server log, and replies can't be fetched until a mailbox is connected.</p>}
    {syncState?.error && <p className="admin-error" role="alert">{syncState.error}</p>}
    {syncState?.ok && <p className="mail-note" role="status">{syncState.ok}</p>}

    {thread.length === 0 ? <p className="mail-empty">No emails yet. Start the conversation below.</p> : <ol ref={threadRef} className="mail-thread" aria-label="Email conversation">
      {thread.map((message) => <li key={message.id} className={`mail-msg is-${message.direction}${message.status === "failed" ? " is-failed" : ""}`}>
        <div className="mail-meta"><b>{message.direction === "in" ? message.fromName || message.from : message.sentBy || "Signsnwraps"}</b><span>{message.at ? dateFormat.format(message.at) : ""}</span>
          {message.direction === "out" && message.status !== "sent" && <em className={`mail-status is-${message.status}`}>{message.status === "logged" ? "Not sent (dev)" : "Failed"}</em>}
          {message.direction === "in" && <em className="mail-status is-received">Reply</em>}</div>
        <p className="mail-subject">{message.subject}</p>
        <p className="mail-body">{message.body}</p>
        {message.files.length > 0 ? <ul className="mail-files" aria-label="Attachments">{message.files.map((file, index) => <li key={file.path}>
            <a href={`/admin/emails/${message.id}/files/${index}`} target="_blank" rel="noreferrer"><Paperclip aria-hidden /> {file.name}</a> <small>{formatSize(file.size)}</small>
            <a className="mail-file-dl" href={`/admin/emails/${message.id}/files/${index}?download=1`} aria-label={`Download ${file.name}`}><Download aria-hidden /></a></li>)}</ul>
          : message.attachments.length > 0 && <p className="mail-attachments">Attached: {message.attachments.join(", ")}</p>}
        {message.quoted && <details className="mail-quoted"><summary>Show quoted text</summary><p className="mail-body">{message.quoted}</p></details>}
        {message.error && <small className="mail-error">{message.error}</small>}
      </li>)}
    </ol>}

    <form onSubmit={submit} className="mail-compose">
      <input type="hidden" name="contextType" value={contextType} /><input type="hidden" name="contextId" value={contextId} />
      <div className="mail-compose-top">
        <span><Reply aria-hidden /> {thread.length ? "Reply" : "New email"} to <b>{to}</b></span>
        <label>Template <select value={template} onChange={(event) => pickTemplate(event.target.value)}><option value="Blank">Blank</option>{templates.map((item) => <option key={item.label} value={item.label}>{item.label}</option>)}</select></label>
      </div>
      <input name="subject" aria-label="Subject" placeholder="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={200} required />
      <textarea name="body" aria-label="Message" placeholder="Write your message…" value={body} onChange={(event) => setBody(event.target.value)} maxLength={10000} rows={7} required />
      <div className="mail-compose-foot">
        {attachLabel ? <label className="mail-attach"><input type="checkbox" name="attachPdf" defaultChecked /> Attach {attachLabel}</label> : <small>Sent from the shared Signsnwraps mailbox. The customer's reply appears here.</small>}
        <button className="button button-orange" type="submit" disabled={sending || mode === "off" || !to}><Send aria-hidden /> {sending ? "Sending…" : "Send"}</button>
      </div>
      {sendState?.error && <p className="admin-error" role="alert">{sendState.error}</p>}
      {sendState?.ok && <p className="admin-ok" role="status">{sendState.ok}</p>}
    </form>
  </div>;
}
