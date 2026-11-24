"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { Send } from "lucide-react";
import type { ChatMessage, ChatSide } from "@/lib/po-chat-types";

type Load = (poId: string) => Promise<{ messages: ChatMessage[] } | { error: string }>;
type Post = (poId: string, text: string) => Promise<{ messages: ChatMessage[] } | { error: string }>;

const when = (ms: number) => new Date(ms).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/**
 * Chat on a purchase order between the vendor and Signs N Wraps staff. Polls for new messages every few seconds while
 * the page is visible (and right away when it becomes visible again). `side` is the viewer's side: theirs on the right.
 */
export function PoChatPanel({ poId, side, initial, load, post, otherName, readOnly = false }: { poId: string; side: ChatSide; initial: ChatMessage[]; load: Load; post: Post; otherName: string; readOnly?: boolean }) {
  const [items, setItems] = useState(initial);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, startSend] = useTransition();
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    let alive = true;
    const refresh = () => { if (document.visibilityState === "visible") load(poId).then((result) => { if (alive && "messages" in result) setItems(result.messages); }).catch(() => undefined); };
    const timer = setInterval(refresh, 6000);
    document.addEventListener("visibilitychange", refresh);
    return () => { alive = false; clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, [poId, load]);
  // Keep the newest message in view.
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight }); }, [items.length]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const message = text.trim();
    if (!message) return;
    setError("");
    startSend(async () => {
      const result = await post(poId, message);
      if ("error" in result) setError(result.error); else { setItems(result.messages); setText(""); }
    });
  }

  return <div className="po-chat" id="chat">
    <div className="po-chat-head"><h2>Messages</h2><small>{side === "staff" ? `Chat with ${otherName} about this job. Only your team and the vendor can see it.` : `Chat with ${otherName} about this job.`}</small></div>
    <ol className="po-chat-list" ref={list} aria-live="polite">
      {items.length === 0 && <li className="po-chat-empty">No messages yet.{readOnly ? "" : " Ask a question or post an update."}</li>}
      {items.map((item) => <li key={item.id} className={item.side === side ? "is-mine" : "is-theirs"}><div className="po-chat-bubble">{item.text}</div><small>{item.by} · {when(item.at)}</small></li>)}
    </ol>
    {readOnly ? <p className="po-chat-note">Preview: messages can't be sent from here.</p> : <form className="po-chat-form" onSubmit={submit}>
      <textarea value={text} rows={2} maxLength={4000} placeholder="Write a message…" onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) submit(event); }} aria-label="Message" />
      <button type="submit" className="button button-orange" disabled={sending || !text.trim()}><Send aria-hidden /> {sending ? "Sending…" : "Send"}</button>
    </form>}
    {error && <p className="admin-error" role="alert">{error}</p>}
  </div>;
}
