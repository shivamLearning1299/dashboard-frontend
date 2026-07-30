"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { useAuth } from "@/lib/auth-context";
import { ApiError, messagingApi, type ChannelSummary, type MessageDto } from "@/lib/api";

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

/* ---------------------------------- types ------------------------------------ */

type ConvoMeta = ChannelSummary;

type Author = "me" | "ai" | { name: string; initials: string };

type ChatMessage = {
  id: string;
  author: Author;
  time: string;
  text: string;
  aiTag?: "Alert" | "Answer";
  table?: { caption: string; rows: { label: string; value: string }[] };
  link?: { label: string; href: string };
};

function authorKey(a: Author) {
  return a === "me" || a === "ai" ? a : `human:${a.name}`;
}

const AI_SUGGESTIONS = ["Revenue by region", "Failed payments this week", "Top customers by LTV"];

function initialsFromName(name: string): string {
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  const chars = parts.length >= 2 ? [parts[0][0], parts[1][0]] : [name[0], name[1]];
  return chars.filter(Boolean).join("").toUpperCase() || "?";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function toChatMessage(m: MessageDto, myEmail: string): ChatMessage {
  const author: Author =
    m.senderType !== "USER"
      ? "ai"
      : m.senderEmail === myEmail
        ? "me"
        : { name: m.senderEmail ?? "Unknown", initials: initialsFromName(m.senderEmail ?? "?") };

  return {
    id: m.id,
    author,
    time: formatTime(m.createdAt),
    text: m.text,
    aiTag: m.aiTag ?? undefined,
    table: m.resultJson ?? undefined,
    link: m.resultJson ? { label: "View full results in Overview", href: "/" } : undefined,
  };
}

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
  channels: ConvoMeta[];
  directMessages: ConvoMeta[];
  active: string;
  onSelect: (id: string) => void;
}) {
  function Row({ convo }: { convo: ConvoMeta }) {
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
            {initialsFromName(convo.name)}
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
        <div className="flex flex-col gap-0.5">
          {directMessages.length === 0 ? (
            <p className="px-2.5 py-2 text-xs text-ink-3">No direct messages yet.</p>
          ) : (
            directMessages.map((c) => <Row key={c.id} convo={c} />)
          )}
        </div>
      </div>
    </aside>
  );
}

function ConvoHeader({ convo }: { convo: ConvoMeta }) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
      {convo.kind === "CHANNEL" ? (
        <IconHash className="h-4 w-4 text-ink-3" />
      ) : (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 font-mono text-[11px] font-medium text-accent">
          {initialsFromName(convo.name)}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{convo.name}</p>
        {convo.description && <p className="truncate text-xs text-ink-3">{convo.description}</p>}
      </div>
    </div>
  );
}

function MessageRow({ message, grouped, myInitials }: { message: ChatMessage; grouped: boolean; myInitials: string }) {
  const isAi = message.author === "ai";
  const isMe = message.author === "me";
  const displayName = isAi ? "shivecom AI" : isMe ? "You" : message.author !== "ai" && message.author !== "me" ? message.author.name : "";
  const initials = isAi ? null : isMe ? myInitials : message.author !== "ai" && message.author !== "me" ? message.author.initials : "";

  if (grouped) {
    return (
      <div className={`group flex gap-3 rounded-lg px-2 py-0.5 hover:bg-surface-2/50 ${isAi ? "bg-accent/5 hover:bg-accent/5" : ""}`}>
        <span className="w-7 shrink-0 text-right font-mono text-[10px] text-ink-3 opacity-0 group-hover:opacity-100">
          {message.time}
        </span>
        <div className="min-w-0 flex-1 text-sm text-ink-2">
          {message.text}
          {message.table && <MiniTable caption={message.table.caption} rows={message.table.rows} />}
          {message.link && (
            <Link href={message.link.href} className="mt-1.5 block text-xs text-accent hover:text-accent-2">
              {message.link.label} →
            </Link>
          )}
        </div>
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
          <span className="font-mono text-[10px] text-ink-3">{message.time}</span>
        </div>
        <div className="mt-0.5 text-sm text-ink-2">
          {message.text}
          {message.table && <MiniTable caption={message.table.caption} rows={message.table.rows} />}
          {message.link && (
            <Link href={message.link.href} className="mt-1.5 block text-xs text-accent hover:text-accent-2">
              {message.link.label} →
            </Link>
          )}
        </div>
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
  convo: ConvoMeta;
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
  const { user } = useAuth();
  const myEmail = user?.email ?? "";
  const myInitials = user ? initialsFromName(user.email.split("@")[0]) : "";

  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [channels, setChannels] = useState<ConvoMeta[]>([]);
  const [directMessages, setDirectMessages] = useState<ConvoMeta[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [mode, setMode] = useState<"message" | "ai">("message");
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const allConvos = [...channels, ...directMessages];
  const convo = allConvos.find((c) => c.id === active) ?? null;
  const thread = active ? (messages[active] ?? []) : [];

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { channels: ch, directMessages: dms } = await messagingApi.listChannels();
        if (cancelled) return;
        setChannels(ch);
        setDirectMessages(dms);
        const preferred = ch.find((c) => c.name === "data-alerts") ?? ch[0] ?? dms[0];
        if (preferred) setActive(preferred.id);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof ApiError ? err.message : "Failed to load messages.");
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!active || messages[active]) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-conversation-change, guarded by `cancelled`
    setThreadLoading(true);
    messagingApi
      .getMessages(active)
      .then((dtos) => {
        if (cancelled) return;
        setMessages((prev) => ({ ...prev, [active]: dtos.map((d) => toChatMessage(d, myEmail)) }));
      })
      .finally(() => {
        if (!cancelled) setThreadLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [thread.length, thinking, active]);

  function selectConvo(id: string) {
    setActive(id);
    setChannels((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
    setDirectMessages((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
  }

  function appendMessages(id: string, newMessages: ChatMessage[]) {
    setMessages((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), ...newMessages] }));
  }

  async function handleSend() {
    const text = draft.trim();
    if (!text || !active) return;
    setDraft("");

    if (mode === "message") {
      const sent = await messagingApi.sendMessage(active, text);
      appendMessages(active, [toChatMessage(sent, myEmail)]);
      return;
    }

    setThinking(true);
    try {
      const { userMessage, aiMessage } = await messagingApi.askAi(active, text);
      appendMessages(active, [toChatMessage(userMessage, myEmail), toChatMessage(aiMessage, myEmail)]);
    } finally {
      setThinking(false);
    }
  }

  if (pageLoading || !user) {
    return (
      <AppShell active="messages" title="Messages">
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  if (loadError || !convo) {
    return (
      <AppShell active="messages" title="Messages">
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          {loadError ?? "No channels found."}
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell active="messages" title="Messages">
      <div className="flex min-h-0 flex-1 gap-4">
        <ConvoRail channels={channels} directMessages={directMessages} active={convo.id} onSelect={selectConvo} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface">
          <ConvoHeader convo={convo} />

          <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4 py-4">
            {threadLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              </div>
            ) : thread.length === 0 && !thinking ? (
              <EmptyConvo />
            ) : (
              thread.map((m, i) => {
                const prev = thread[i - 1];
                const grouped = Boolean(prev) && authorKey(prev.author) === authorKey(m.author) && !m.aiTag;
                return <MessageRow key={m.id} message={m} grouped={grouped} myInitials={myInitials} />;
              })
            )}
            {thinking && <ThinkingRow />}
          </div>

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
