"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { ref, uploadBytesResumable } from "firebase/storage";
import { Download, Loader2, Paperclip, RefreshCw, Reply, Send, X } from "lucide-react";
import { clientStorage, isClientStorageConfigured } from "@/lib/firebase/client";
import { formatBytes as formatSize, uploadContentType } from "@/lib/uploads";
import { checkReplies, sendEmail, startEmailUpload } from "./email-actions";
import type { EmailTemplate } from "@/lib/email-templates";
import type { ThreadMessage } from "@/lib/email";

const dateFormat = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Australia/Melbourne" });
const reSubject = (subject: string) => (/^re:/i.test(subject) ? subject : `Re: ${subject}`);
// Same limits as the server and storage.rules: 10 files, 15 MB in total.
const MAX_FILES = 10, MAX_TOTAL_BYTES = 15 * 1024 * 1024;
const safeName = (name: string) => name.normalize("NFKD").replace(/[^\w.\-]+/g, "_").replace(/^_+/, "").slice(-120) || "file";
type Attached = { id: string; name: string; size: number; path: string; progress: number; status: "uploading" | "done" | "error" };

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
  // Files attached to the next email: uploaded straight to Storage (staff-uploads/<session>/…), then sent by the server.
  const [files, setFiles] = useState<Attached[]>([]);
  const [fileSession, setFileSession] = useState("");
  const [fileNotice, setFileNotice] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const uploading = files.some((file) => file.status === "uploading");
  // Reset the reply box after a successful send (adjusting state during render, per the React docs).
  if (sendState?.sentAt && sendState.sentAt !== sentAt) { setSentAt(sendState.sentAt); setTemplate("Blank"); setSubject(reSubject(subject)); setBody(blank.body); setFiles([]); }

  const updateFile = (id: string, change: Partial<Attached>) => setFiles((current) => current.map((file) => (file.id === id ? { ...file, ...change } : file)));
  async function attach(list: FileList | null) {
    setFileNotice("");
    const incoming = [...(list ?? [])];
    if (fileInput.current) fileInput.current.value = "";
    if (!incoming.length) return;
    let total = files.reduce((sum, file) => sum + file.size, 0);
    const accepted: File[] = [];
    for (const file of incoming) {
      if (files.length + accepted.length >= MAX_FILES) { setFileNotice(`Up to ${MAX_FILES} files per email.`); break; }
      if (total + file.size > MAX_TOTAL_BYTES) { setFileNotice(`${file.name} would take this email over 15 MB. Send large files as a link instead.`); continue; }
      total += file.size; accepted.push(file);
    }
    if (!accepted.length) return;
    let session = fileSession;
    if (!session) {
      const result = await startEmailUpload();
      if ("error" in result) { setFileNotice(result.error); return; }
      session = result.id; setFileSession(session);
    }
    for (const file of accepted) {
      const id = crypto.randomUUID().slice(0, 8);
      const path = `staff-uploads/${session}/${id}-${safeName(file.name)}`;
      setFiles((current) => [...current, { id, name: file.name, size: file.size, path, progress: 0, status: "uploading" }]);
      const task = uploadBytesResumable(ref(clientStorage(), path), file, { contentType: uploadContentType(file.name, file.type) });
      task.on("state_changed", (snapshot) => updateFile(id, { progress: snapshot.totalBytes ? snapshot.bytesTransferred / snapshot.totalBytes : 0 }),
        () => updateFile(id, { status: "error" }), () => updateFile(id, { status: "done", progress: 1 }));
    }
  }

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
    form.set("fileSession", fileSession);
    form.set("files", JSON.stringify(files.filter((file) => file.status === "done").map((file) => ({ path: file.path, name: file.name }))));
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
      {files.length > 0 && <ul className="mail-files mail-files-out" aria-label="Files to send">{files.map((file) => <li key={file.id} className={`is-${file.status}`}>
        {file.status === "uploading" ? <Loader2 aria-hidden className="is-spinning" /> : <Paperclip aria-hidden />}<span>{file.name}</span>
        <small>{file.status === "uploading" ? `${Math.round(file.progress * 100)}%` : file.status === "error" ? "Upload failed" : formatSize(file.size)}</small>
        <button type="button" className="mail-file-dl" onClick={() => setFiles((current) => current.filter((item) => item.id !== file.id))} aria-label={`Remove ${file.name}`}><X aria-hidden /></button></li>)}</ul>}
      {fileNotice && <p className="admin-error" role="alert">{fileNotice}</p>}
      <div className="mail-compose-foot">
        <div className="mail-compose-options">
          {isClientStorageConfigured && <><input ref={fileInput} type="file" multiple hidden onChange={(event) => attach(event.target.files)} />
            <button type="button" className="mail-attach-btn" onClick={() => fileInput.current?.click()} disabled={files.length >= MAX_FILES}><Paperclip aria-hidden /> Attach files</button></>}
          {attachLabel ? <label className="mail-attach"><input type="checkbox" name="attachPdf" defaultChecked /> Attach {attachLabel}</label> : <small>Sent from the shared Signsnwraps mailbox. The customer's reply appears here.</small>}
        </div>
        <button className="button button-orange" type="submit" disabled={sending || uploading || mode === "off" || !to}><Send aria-hidden /> {sending ? "Sending…" : uploading ? "Uploading…" : "Send"}</button>
      </div>
      {sendState?.error && <p className="admin-error" role="alert">{sendState.error}</p>}
      {sendState?.ok && <p className="admin-ok" role="status">{sendState.ok}</p>}
    </form>
  </div>;
}
