"use client";

import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { ref, uploadBytesResumable, type UploadTask } from "firebase/storage";
import { CheckCircle2, FileText, ImageIcon, Loader2, Paperclip, RotateCw, UploadCloud, X, XCircle } from "lucide-react";
import { clientStorage, isClientStorageConfigured } from "@/lib/firebase/client";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_FILES, UPLOAD_ACCEPT, UPLOAD_HINT, formatBytes, isAllowedUpload, uploadContentType } from "@/lib/uploads";

type Item = { id: string; file: File; preview: string | null; status: "uploading" | "done" | "error"; progress: number; path: string; error: string; task?: UploadTask };

const safeName = (name: string) => name.normalize("NFKD").replace(/[^\w.\-]+/g, "_").replace(/^_+/, "").slice(-100) || "file";

/**
 * Attachments for the booking and quote forms. Files upload straight to Cloud Storage as soon as they're
 * picked (with progress), so big photos and PDFs aren't limited by the website's request size. The form
 * submits hidden `uploadSession` + `uploadedFiles` fields, and the server moves the files onto the enquiry.
 * Without Storage configured it falls back to a normal file input.
 */
export function FileUploader({ label, onBusyChange }: { label: string; onBusyChange?: (busy: boolean) => void }) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [session, setSession] = useState("");
  const [notice, setNotice] = useState("");
  const [dragging, setDragging] = useState(false);
  const busy = items.some((item) => item.status === "uploading");

  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  // Release image previews when they're no longer shown.
  useEffect(() => () => { items.forEach((item) => item.preview && URL.revokeObjectURL(item.preview)); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (id: string, change: Partial<Item>) => setItems((current) => current.map((item) => (item.id === id ? { ...item, ...change } : item)));

  async function ensureSession() {
    if (session) return session;
    const response = await fetch("/api/uploads", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.id) throw new Error(data.error || "File uploads aren't available right now.");
    setSession(data.id);
    return data.id as string;
  }

  function start(item: Item, sessionId: string) {
    const path = `uploads/${sessionId}/${item.id}-${safeName(item.file.name)}`;
    const task = uploadBytesResumable(ref(clientStorage(), path), item.file, { contentType: uploadContentType(item.file.name, item.file.type), customMetadata: { originalName: item.file.name.slice(0, 200) } });
    update(item.id, { status: "uploading", progress: 0, error: "", path, task });
    task.on("state_changed",
      (snapshot) => update(item.id, { progress: snapshot.totalBytes ? snapshot.bytesTransferred / snapshot.totalBytes : 0 }),
      () => update(item.id, { status: "error", error: "Upload failed. Check your connection and try again." }),
      () => update(item.id, { status: "done", progress: 1 }));
  }

  async function add(list: FileList | File[]) {
    setNotice("");
    const incoming = [...list];
    const room = MAX_UPLOAD_FILES - items.length;
    const problems: string[] = [];
    const accepted = incoming.filter((file) => {
      if (!isAllowedUpload(file.name, file.type)) { problems.push(`${file.name}: this file type isn't supported`); return false; }
      if (file.size > MAX_UPLOAD_BYTES) { problems.push(`${file.name}: larger than 10 MB (${formatBytes(file.size)})`); return false; }
      if (items.some((item) => item.file.name === file.name && item.file.size === file.size)) return false; // already added
      return true;
    });
    if (accepted.length > room) problems.push(`Only ${MAX_UPLOAD_FILES} files can be attached${room > 0 ? `, so ${accepted.length - room} weren't added` : ""}.`);
    const next = accepted.slice(0, Math.max(room, 0)).map((file): Item => ({ id: crypto.randomUUID().slice(0, 8), file, preview: file.type.startsWith("image/") && file.type !== "image/heic" && file.type !== "image/heif" ? URL.createObjectURL(file) : null, status: "uploading", progress: 0, path: "", error: "" }));
    if (problems.length) setNotice(problems.join(" · "));
    if (!next.length) return;
    setItems((current) => [...current, ...next]);
    if (!isClientStorageConfigured) return; // fallback: the hidden input below carries the files
    try {
      const sessionId = await ensureSession();
      next.forEach((item) => start(item, sessionId));
    } catch (error) {
      next.forEach((item) => update(item.id, { status: "error", error: error instanceof Error ? error.message : "Upload failed." }));
    }
  }

  function remove(id: string) {
    setItems((current) => current.filter((item) => {
      if (item.id !== id) return true;
      item.task?.cancel();
      if (item.preview) URL.revokeObjectURL(item.preview);
      return false;
    }));
  }

  // Fallback (no browser Storage): mirror the chosen files into a normal multipart input.
  useEffect(() => {
    if (isClientStorageConfigured || !inputRef.current || typeof DataTransfer === "undefined") return;
    const transfer = new DataTransfer();
    items.forEach((item) => transfer.items.add(item.file));
    inputRef.current.files = transfer.files;
  }, [items]);

  const onDrop = (event: DragEvent) => { event.preventDefault(); setDragging(false); if (event.dataTransfer.files.length) add(event.dataTransfer.files); };
  const uploaded = items.filter((item) => item.status === "done").map((item) => ({ path: item.path, name: item.file.name }));

  return <div className="uploader">
    <span className="uploader-label" id={`${inputId}-label`}>{label}</span>
    <div className={`uploader-drop${dragging ? " is-dragging" : ""}${items.length >= MAX_UPLOAD_FILES ? " is-full" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
      <UploadCloud aria-hidden />
      <p><b>Drag files here</b> or <label htmlFor={inputId} className="uploader-browse">choose files</label></p>
      <small>{UPLOAD_HINT}</small>
      <input id={inputId} ref={inputRef} type="file" multiple accept={UPLOAD_ACCEPT} aria-labelledby={`${inputId}-label`} disabled={items.length >= MAX_UPLOAD_FILES}
        name={isClientStorageConfigured ? undefined : "files"}
        onChange={(event) => { if (event.target.files?.length) add(event.target.files); if (isClientStorageConfigured) event.target.value = ""; }} />
    </div>
    {notice && <p className="uploader-notice" role="alert">{notice}</p>}
    {items.length > 0 && <ul className="uploader-list" aria-label="Attached files">
      {items.map((item) => <li key={item.id} className={`is-${item.status}`}>
        <span className="uploader-thumb">{item.preview ? <img src={item.preview} alt="" /> : item.file.type.startsWith("image/") ? <ImageIcon aria-hidden /> : <FileText aria-hidden />}</span>
        <span className="uploader-meta">
          <b title={item.file.name}>{item.file.name}</b>
          <small>{formatBytes(item.file.size)} · {!isClientStorageConfigured ? "Attached" : item.status === "done" ? "Uploaded" : item.status === "error" ? item.error : `Uploading ${Math.round(item.progress * 100)}%`}</small>
          {isClientStorageConfigured && item.status === "uploading" && <i className="uploader-bar"><i style={{ width: `${Math.round(item.progress * 100)}%` }} /></i>}
        </span>
        <span className="uploader-state" aria-hidden>{!isClientStorageConfigured ? <Paperclip /> : item.status === "done" ? <CheckCircle2 /> : item.status === "error" ? <XCircle /> : <Loader2 className="is-spinning" />}</span>
        {item.status === "error" && session && <button type="button" className="uploader-icon" onClick={() => start(item, session)} aria-label={`Retry ${item.file.name}`}><RotateCw /></button>}
        <button type="button" className="uploader-icon" onClick={() => remove(item.id)} aria-label={`Remove ${item.file.name}`}><X /></button>
      </li>)}
    </ul>}
    {items.length > 0 && <p className="uploader-count">{items.length} of {MAX_UPLOAD_FILES} files{busy ? " · uploading…" : ""}</p>}
    {isClientStorageConfigured && <><input type="hidden" name="uploadSession" value={session} /><input type="hidden" name="uploadedFiles" value={JSON.stringify(uploaded)} /></>}
  </div>;
}
