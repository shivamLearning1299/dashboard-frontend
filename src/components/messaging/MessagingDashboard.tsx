"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";

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

/* --------------------------------- mock data -------------------------------- */

type ConvoMeta = {
  id: string;
  kind: "channel" | "dm";
  name: string;
  description?: string;
  memberCount?: number;
  online?: boolean;
  initials?: string;
};

const CHANNELS: ConvoMeta[] = [
  { id: "general", kind: "channel", name: "general", description: "Company-wide announcements", memberCount: 24 },
  { id: "product", kind: "channel", name: "product", description: "Product & roadmap discussion", memberCount: 9 },
  {
    id: "data-alerts",
    kind: "channel",
    name: "data-alerts",
    description: "Automated alerts from shivecom queries",
    memberCount: 6,
  },
  { id: "incidents", kind: "channel", name: "incidents", description: "Active incident coordination", memberCount: 5 },
];

const DMS: ConvoMeta[] = [
  { id: "dm-arjun", kind: "dm", name: "Arjun Mehta", initials: "AM", online: true },
  { id: "dm-lena", kind: "dm", name: "Lena Ford", initials: "LF", online: false },
  { id: "dm-sam", kind: "dm", name: "Sam Okafor", initials: "SO", online: true },
];

const CONVO_LOOKUP: Record<string, ConvoMeta> = Object.fromEntries(
  [...CHANNELS, ...DMS].map((c) => [c.id, c])
);

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

const SEED_MESSAGES: Record<string, ChatMessage[]> = {
  general: [
    {
      id: "g1",
      author: { name: "Sam Okafor", initials: "SO" },
      time: "8:41 AM",
      text: "Welcome to the new shivecom workspace, everyone 👋",
    },
    { id: "g2", author: "me", time: "8:52 AM", text: "Excited to get the team on this — data-alerts channel is already useful." },
  ],
  product: [
    { id: "p1", author: { name: "Lena Ford", initials: "LF" }, time: "Yesterday", text: "Scheduled queries shipped to Pro plans today." },
    { id: "p2", author: { name: "Arjun Mehta", initials: "AM" }, time: "Yesterday", text: "Nice. Docs updated?" },
    { id: "p3", author: { name: "Lena Ford", initials: "LF" }, time: "Yesterday", text: "Yep, linked in #general." },
  ],
  "data-alerts": [
    {
      id: "d1",
      author: "ai",
      time: "9:02 AM",
      aiTag: "Alert",
      text: "Failed payments are up 3× vs last week — 5 failures in the last 24h.",
    },
    { id: "d2", author: "me", time: "9:04 AM", text: "Hooli Devices declined again — that's twice this week." },
    {
      id: "d3",
      author: { name: "Arjun Mehta", initials: "AM" },
      time: "9:05 AM",
      text: "Yeah, saw that on the dashboard. Can we get a breakdown by reason?",
    },
    {
      id: "d4",
      author: "ai",
      time: "9:06 AM",
      aiTag: "Answer",
      text: "Here's the breakdown for the last 7 days:",
      table: {
        caption: "Failed payments by reason",
        rows: [
          { label: "Card declined", value: "3" },
          { label: "Insufficient funds", value: "1" },
          { label: "Expired card", value: "1" },
        ],
      },
      link: { label: "View full results in Overview", href: "/" },
    },
    { id: "d5", author: "me", time: "9:07 AM", text: "Nice, thanks!" },
  ],
  incidents: [],
  "dm-arjun": [
    { id: "a1", author: { name: "Arjun Mehta", initials: "AM" }, time: "10:15 AM", text: "Got a sec to look at the APAC numbers?" },
    { id: "a2", author: "me", time: "10:20 AM", text: "Yep, pulling them up now." },
    { id: "a3", author: { name: "Arjun Mehta", initials: "AM" }, time: "10:20 AM", text: "🙏" },
  ],
  "dm-lena": [],
  "dm-sam": [
    { id: "s1", author: { name: "Sam Okafor", initials: "SO" }, time: "Monday", text: "Standup moved to 9:30 this week." },
    { id: "s2", author: "me", time: "Monday", text: "Got it, thanks for the heads up." },
  ],
};

const AI_ANSWERS: { keywords: string[]; text: string; caption: string; rows: { label: string; value: string }[] }[] = [
  {
    keywords: ["fail", "declin", "payment"],
    text: "Here's the breakdown of failed payments over the last 7 days:",
    caption: "Failed payments by reason",
    rows: [
      { label: "Card declined", value: "3" },
      { label: "Insufficient funds", value: "1" },
      { label: "Expired card", value: "1" },
    ],
  },
  {
    keywords: ["customer", "ltv", "lifetime"],
    text: "Your top customers by lifetime value right now:",
    caption: "Top customers (LTV)",
    rows: [
      { label: "Northwind Traders", value: "$84,200" },
      { label: "Globex Retail", value: "$71,950" },
      { label: "Initech Labs", value: "$52,300" },
    ],
  },
  {
    keywords: ["revenue", "region", "mrr"],
    text: "Revenue by region over the last 3 months:",
    caption: "Revenue by region (USD)",
    rows: [
      { label: "NA", value: "$426,500" },
      { label: "EMEA", value: "$304,400" },
      { label: "APAC", value: "$205,000" },
    ],
  },
];

function findAiAnswer(question: string) {
  const q = question.toLowerCase();
  return AI_ANSWERS.find((a) => a.keywords.some((k) => q.includes(k))) ?? AI_ANSWERS[2];
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
  active,
  unread,
  onSelect,
}: {
  active: string;
  unread: Record<string, number>;
  onSelect: (id: string) => void;
}) {
  function Row({ convo }: { convo: ConvoMeta }) {
    const isActive = convo.id === active;
    const count = unread[convo.id] ?? 0;
    return (
      <button
        type="button"
        onClick={() => onSelect(convo.id)}
        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
          isActive ? "bg-surface-2 text-ink" : count > 0 ? "text-ink" : "text-ink-2 hover:text-ink"
        }`}
      >
        {convo.kind === "channel" ? (
          <IconHash className="h-3.5 w-3.5 shrink-0 text-ink-3" />
        ) : (
          <span className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 font-mono text-[10px] font-medium text-accent">
            {convo.initials}
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full ring-2 ring-surface ${
                convo.online ? "bg-success" : "bg-ink-3"
              }`}
            />
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
          {CHANNELS.map((c) => (
            <Row key={c.id} convo={c} />
          ))}
        </div>
        <p className="px-2.5 pb-1 pt-4 font-mono text-[11px] uppercase tracking-wide text-ink-3">Direct messages</p>
        <div className="flex flex-col gap-0.5">
          {DMS.map((c) => (
            <Row key={c.id} convo={c} />
          ))}
        </div>
      </div>
    </aside>
  );
}

function ConvoHeader({ convo }: { convo: ConvoMeta }) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
      {convo.kind === "channel" ? (
        <IconHash className="h-4 w-4 text-ink-3" />
      ) : (
        <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 font-mono text-[11px] font-medium text-accent">
          {convo.initials}
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-surface ${
              convo.online ? "bg-success" : "bg-ink-3"
            }`}
          />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{convo.name}</p>
        <p className="truncate text-xs text-ink-3">
          {convo.kind === "channel" ? `${convo.description} · ${convo.memberCount} members` : convo.online ? "Online" : "Away"}
        </p>
      </div>
    </div>
  );
}

function MessageRow({ message, grouped }: { message: ChatMessage; grouped: boolean }) {
  const isAi = message.author === "ai";
  const isMe = message.author === "me";
  const displayName = isAi ? "shivecom AI" : isMe ? "Priya Raman" : message.author !== "ai" && message.author !== "me" ? message.author.name : "";
  const initials = isAi ? null : isMe ? "PR" : message.author !== "ai" && message.author !== "me" ? message.author.initials : "";

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
              : `Message ${convo.kind === "channel" ? `#${convo.name}` : convo.name}`
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
  const [active, setActive] = useState("data-alerts");
  const [messages, setMessages] = useState(SEED_MESSAGES);
  const [unread, setUnread] = useState<Record<string, number>>({ product: 2, "dm-lena": 1 });
  const [mode, setMode] = useState<"message" | "ai">("message");
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const convo = CONVO_LOOKUP[active];
  const thread = messages[active] ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [thread.length, thinking, active]);

  function selectConvo(id: string) {
    setActive(id);
    setUnread((prev) => ({ ...prev, [id]: 0 }));
  }

  function appendMessage(id: string, message: ChatMessage) {
    setMessages((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), message] }));
  }

  function handleSend() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");

    if (mode === "message") {
      appendMessage(active, { id: crypto.randomUUID(), author: "me", time: "Just now", text });
      return;
    }

    appendMessage(active, { id: crypto.randomUUID(), author: "me", time: "Just now", text });
    setThinking(true);
    window.setTimeout(() => {
      const answer = findAiAnswer(text);
      appendMessage(active, {
        id: crypto.randomUUID(),
        author: "ai",
        time: "Just now",
        aiTag: "Answer",
        text: answer.text,
        table: { caption: answer.caption, rows: answer.rows },
        link: { label: "View full results in Overview", href: "/" },
      });
      setThinking(false);
    }, 900);
  }

  return (
    <AppShell active="messages" title="Messages">
      <div className="flex min-h-0 flex-1 gap-4">
        <ConvoRail active={active} unread={unread} onSelect={selectConvo} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface">
          <ConvoHeader convo={convo} />

          <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4 py-4">
            {thread.length === 0 && !thinking ? (
              <EmptyConvo />
            ) : (
              thread.map((m, i) => {
                const prev = thread[i - 1];
                const grouped = Boolean(prev) && authorKey(prev.author) === authorKey(m.author) && !m.aiTag;
                return <MessageRow key={m.id} message={m} grouped={grouped} />;
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
            onSend={handleSend}
            disabled={thinking}
          />
        </div>
      </div>
    </AppShell>
  );
}
