"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { useAuth } from "@/lib/auth/AuthContext";
import { ApiError } from "@/lib/auth/api";
import {
  askAi,
  getChannels,
  getMessages,
  sendMessage,
  type ChannelSummary,
  type MessageDto,
} from "@/lib/messaging/api";

/* ---------------------------------- icons ---------------------------------- */

type IconProps = { className?: string };

function IconHash({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M7.5 3.5 5.5 16.5M14.5 3.5l-2 13M3.5 8h13M2.7 12.5h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconSearch({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16.5 16.5 13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconSparkle({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path d="M9 2.3c.4 2.5 1 3.9 2.1 5S13.7 8.6 16 9c-2.3.4-3.9 1-5 2.1S9.4 13.7 9 16c-.4-2.3-1-3.9-2.1-5S4.3 9.4 2 9c2.3-.4 3.9-1 5-2.1S8.6 4.6 9 2.3Z" />
      <path d="M15.2 13c.2 1 .5 1.7 1 2.2s1.2.8 2.2 1c-1 .2-1.7.5-2.2 1s-.8 1.2-1 2.2c-.2-1-.5-1.7-1-2.2s-1.2-.8-2.2-1c1-.2 1.7-.5 2.2-1s.8-1.2 1-2.2Z" />
    </svg>
  );
}

function IconSend({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M17 3 3 8.8l5.8 2.4L11.2 17 17 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8.8 11.2 17 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* -------------------------------- formatting -------------------------------- */

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

const AI_SUGGESTIONS = ["Revenue by region", "Failed payments this week", "Top customers by LTV"];

/* --------------------------------- sections ----------------------------------- */

function MiniTable({ caption, rows }: { caption: string; rows: { label: string; value: string }[] }) {
  return (
    <div className="mt-2 max-w-xs overflow-hidden rounded-lg border border-border-strong/60">
      <p className="border-b border-border-strong/60 bg-bg/40 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-ink-3">
        {caption}
      </p>
      <div className="divide-y divide-border-strong/40">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between px-3 py-1.5 text-xs">
            <span className="text-ink-2">{r.label}</span>
            <span className="font-mono tabular-nums text-ink">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConvoRail({
  channels,
  directMessages,
  active,
  onSelect,
}: {
  channels: ChannelSummary[];
  directMessages: ChannelSummary[];
  active: string | null;
  onSelect: (id: string) => void;
}) {
  function Row({ convo }: { convo: ChannelSummary }) {
    const isActive = convo.id === active;
    const count = convo.unreadCount;
    return (
      <button
        type="button"
        onClick={() => onSelect(convo.id)}
        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
          isActive ? "bg-surface-2 text-ink" : count > 0 ? "text-ink" : "text-ink-2 hover:text-ink"
        }`}
      >
        {convo.kind === "CHANNEL" ? (
          <IconHash className="h-3.5 w-3.5 shrink-0 text-ink-3" />
        ) : (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 font-mono text-[10px] font-medium text-accent">
            {convo.name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <span className={`flex-1 truncate ${count > 0 ? "font-medium" : ""}`}>{convo.name}</span>
        {count > 0 && (
          <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-semibold text-white">
            {count}
          </span>
        )}
      </button>
    );
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-surface md:flex">
      <div className="border-b border-border p-3">
        <div className="flex items-center gap-2 rounded-lg border border-border-strong bg-bg px-2.5 py-1.5">
          <IconSearch className="h-3.5 w-3.5 text-ink-3" />
          <input
            type="text"
            placeholder="Search messages"
            className="w-full bg-transparent text-xs text-ink placeholder:text-ink-3 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <p className="px-2.5 pb-1 pt-2 font-mono text-[11px] uppercase tracking-wide text-ink-3">Channels</p>
        <div className="flex flex-col gap-0.5">
          {channels.map((c) => (
            <Row key={c.id} convo={c} />
          ))}
        </div>
        <p className="px-2.5 pb-1 pt-4 font-mono text-[11px] uppercase tracking-wide text-ink-3">Direct messages</p>
        {directMessages.length === 0 ? (
          <p className="px-2.5 py-1 text-xs text-ink-3">Invite your team to start DMs.</p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {directMessages.map((c) => (
              <Row key={c.id} convo={c} />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

function ConvoHeader({ convo }: { convo: ChannelSummary }) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
      {convo.kind === "CHANNEL" ? (
        <IconHash className="h-4 w-4 text-ink-3" />
      ) : (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 font-mono text-[11px] font-medium text-accent">
          {convo.name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{convo.name}</p>
        {convo.description && <p className="truncate text-xs text-ink-3">{convo.description}</p>}
      </div>
    </div>
  );
}

function MessageRow({
  message,
  grouped,
  currentUserEmail,
}: {
  message: MessageDto;
  grouped: boolean;
  currentUserEmail: string;
}) {
  const isAi = message.senderType === "AI";
  const isMe = message.senderType === "USER" && message.senderEmail === currentUserEmail;
  const displayName = isAi ? "shivecom AI" : isMe ? "You" : (message.senderEmail?.split("@")[0] ?? "Someone");
  const initials = isAi ? null : (message.senderEmail ?? "??").slice(0, 2).toUpperCase();
  const showResultLink = isAi && message.aiTag === "Answer";

  const body = (
    <>
      {message.text}
      {message.resultJson && <MiniTable caption={message.resultJson.caption} rows={message.resultJson.rows} />}
      {showResultLink && (
        <Link href="/" className="mt-1.5 block text-xs text-accent hover:text-accent-2">
          View full results in Overview →
        </Link>
      )}
    </>
  );

  if (grouped) {
    return (
      <div className={`group flex gap-3 rounded-lg px-2 py-0.5 hover:bg-surface-2/50 ${isAi ? "bg-accent/5 hover:bg-accent/5" : ""}`}>
        <span className="w-7 shrink-0 text-right font-mono text-[10px] text-ink-3 opacity-0 group-hover:opacity-100">
          {formatMessageTime(message.createdAt)}
        </span>
        <div className="min-w-0 flex-1 text-sm text-ink-2">{body}</div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-2/50 ${isAi ? "bg-accent/5 hover:bg-accent/5" : ""}`}>
      {isAi ? (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
          <IconSparkle className="h-3.5 w-3.5" />
        </span>
      ) : (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-xs font-medium text-ink-2">
          {initials}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-ink">{displayName}</span>
          {message.aiTag && (
            <span
              className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                message.aiTag === "Alert" ? "border-warning/30 bg-warning/10 text-warning" : "border-accent/30 bg-accent/10 text-accent"
              }`}
            >
              {message.aiTag}
            </span>
          )}
          <span className="font-mono text-[10px] text-ink-3">{formatMessageTime(message.createdAt)}</span>
        </div>
        <div className="mt-0.5 text-sm text-ink-2">{body}</div>
      </div>
    </div>
  );
}

function ThinkingRow() {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-accent/5 px-2 py-1.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
        <IconSparkle className="h-3.5 w-3.5" />
      </span>
      <span className="font-mono text-xs text-ink-3">shivecom AI is thinking…</span>
    </div>
  );
}

function EmptyConvo() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
      <p className="text-sm font-medium text-ink-2">No messages yet</p>
      <p className="text-xs text-ink-3">Say hello, or ask AI a question about your data.</p>
    </div>
  );
}

function Composer({
  convo,
  mode,
  onModeChange,
  draft,
  onDraftChange,
  onSend,
  disabled,
}: {
  convo: ChannelSummary;
  mode: "message" | "ai";
  onModeChange: (m: "message" | "ai") => void;
  draft: string;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
}) {
  return (
    <div className="border-t border-border p-4">
      <div className="mb-2 flex items-center gap-0.5 rounded-lg bg-surface-2 p-0.5">
        <button
          type="button"
          onClick={() => onModeChange("message")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "message" ? "bg-bg text-ink" : "text-ink-2 hover:text-ink"
          }`}
        >
          Message
        </button>
        <button
          type="button"
          onClick={() => onModeChange("ai")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "ai" ? "bg-bg text-ink" : "text-ink-2 hover:text-ink"
          }`}
        >
          <IconSparkle className="h-3 w-3" />
          Ask AI
        </button>
      </div>

      <div className="flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          disabled={disabled}
          rows={1}
          placeholder={
            mode === "ai"
              ? "Ask AI about your revenue, customers, or data…"
              : `Message ${convo.kind === "CHANNEL" ? `#${convo.name}` : convo.name}`
          }
          className="max-h-32 flex-1 resize-none rounded-lg border border-border-strong bg-bg px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || draft.trim().length === 0}
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-2 disabled:cursor-not-allowed disabled:opacity-50"
          title={mode === "ai" ? "Ask AI" : "Send message"}
        >
          <IconSend className="h-4 w-4" />
        </button>
      </div>

      {mode === "ai" && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-ink-3">Try:</span>
          {AI_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onDraftChange(s)}
              className="rounded-full border border-border px-3 py-1 text-xs text-ink-2 transition-colors hover:border-accent/50 hover:text-ink"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------------- page root --------------------------------- */

export default function MessagingDashboard() {
  const { apiFetch, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [channels, setChannels] = useState<ChannelSummary[]>([]);
  const [directMessages, setDirectMessages] = useState<ChannelSummary[]>([]);
  const [active, setActive] = useState<string | null>(null);

  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [mode, setMode] = useState<"message" | "ai">("message");
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const allConvos = [...channels, ...directMessages];
  const convo = allConvos.find((c) => c.id === active) ?? null;

  useEffect(() => {
    getChannels(apiFetch)
      .then((res) => {
        setChannels(res.channels);
        setDirectMessages(res.directMessages);
        const dataAlerts = res.channels.find((c) => c.name === "data-alerts");
        setActive(dataAlerts?.id ?? res.channels[0]?.id ?? res.directMessages[0]?.id ?? null);
      })
      .catch(() => setLoadError("Couldn't load your channels. Try refreshing the page."))
      .finally(() => setLoading(false));
  }, [apiFetch]);

  useEffect(() => {
    if (!active) return;
    // setMessagesLoading below runs inside a .then() continuation, not
    // synchronously in the effect body — this reacts to the channel
    // selection changing, it isn't a derived-state calculation.
    Promise.resolve().then(() => {
      setMessagesLoading(true);
      return getMessages(apiFetch, active)
        .then((msgs) => {
          setMessages(msgs);
          // optimistic local clear — the server already marked it read via this same call
          setChannels((prev) => prev.map((c) => (c.id === active ? { ...c, unreadCount: 0 } : c)));
          setDirectMessages((prev) => prev.map((c) => (c.id === active ? { ...c, unreadCount: 0 } : c)));
        })
        .finally(() => setMessagesLoading(false));
    });
  }, [apiFetch, active]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length, thinking, active]);

  async function handleSend() {
    const text = draft.trim();
    if (!active || !text) return;
    setDraft("");
    setSendError(null);

    if (mode === "message") {
      try {
        const message = await sendMessage(apiFetch, active, text);
        setMessages((prev) => [...prev, message]);
      } catch (err) {
        setSendError(err instanceof ApiError ? err.message : "Couldn't send that message.");
      }
      return;
    }

    setThinking(true);
    try {
      const { userMessage, aiMessage } = await askAi(apiFetch, active, text);
      setMessages((prev) => [...prev, userMessage, aiMessage]);
    } catch (err) {
      setSendError(err instanceof ApiError ? err.message : "Couldn't reach the AI.");
    } finally {
      setThinking(false);
    }
  }

  if (loading) {
    return (
      <AppShell active="messages" title="Messages">
        <div className="flex flex-1 items-center justify-center text-sm text-ink-3">Loading channels…</div>
      </AppShell>
    );
  }

  if (loadError || !convo) {
    return (
      <AppShell active="messages" title="Messages">
        <div className="flex flex-1 items-center justify-center text-sm text-danger">
          {loadError ?? "No channels available."}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell active="messages" title="Messages">
      <div className="flex min-h-0 flex-1 gap-4">
        <ConvoRail
          channels={channels}
          directMessages={directMessages}
          active={active}
          onSelect={setActive}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface">
          <ConvoHeader convo={convo} />

          <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4 py-4">
            {messagesLoading ? (
              <p className="text-sm text-ink-3">Loading messages…</p>
            ) : messages.length === 0 && !thinking ? (
              <EmptyConvo />
            ) : (
              messages.map((m, i) => {
                const prev = messages[i - 1];
                const grouped =
                  Boolean(prev) &&
                  prev.senderType === m.senderType &&
                  prev.senderEmail === m.senderEmail &&
                  !m.aiTag;
                return (
                  <MessageRow key={m.id} message={m} grouped={grouped} currentUserEmail={user?.email ?? ""} />
                );
              })
            )}
            {thinking && <ThinkingRow />}
          </div>

          {sendError && <p className="px-4 text-sm text-danger">{sendError}</p>}

          <Composer
            convo={convo}
            mode={mode}
            onModeChange={setMode}
            draft={draft}
            onDraftChange={setDraft}
            onSend={() => void handleSend()}
            disabled={thinking}
          />
        </div>
      </div>
    </AppShell>
  );
}
