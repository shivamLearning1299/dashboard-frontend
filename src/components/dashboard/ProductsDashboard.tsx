"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import {
  IconChevron,
  IconPlus,
  IconWarning,
  type IconProps,
} from "@/components/icons";
import { ApiError, billingApi, queriesApi, type QueryResult, type RecentQuery, type Subscription } from "@/lib/api";

/* ------------------------------ page-specific icons --------------------------- */

function IconDatabase({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <ellipse cx="10" cy="5" rx="6.5" ry="2.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 5v10c0 1.2 2.9 2.2 6.5 2.2s6.5-1 6.5-2.2V5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 10c0 1.2 2.9 2.2 6.5 2.2s6.5-1 6.5-2.2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconPlay({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path d="M6.5 4.8c0-.9 1-1.4 1.7-.9l7.6 5.2c.6.4.6 1.3 0 1.8l-7.6 5.2c-.7.5-1.7 0-1.7-.9V4.8Z" />
    </svg>
  );
}

function IconTable({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="4" width="14" height="12" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 8.3h14M8 4v12" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconBars({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M4.5 16V9M10 16V4M15.5 16v-6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------ still-mock section --------------------------- */
// No backend model for connected data sources yet — this stays hardcoded
// until a data-source-connection feature exists server-side.
const DATA_SOURCES = {
  connected: 3,
  limit: 5,
  list: ["prod_postgres", "warehouse_bq", "stripe_sync"],
};

const EXAMPLE_QUESTIONS = [
  "Monthly revenue by region, last 6 months",
  "Top customers by lifetime value",
  "Payments that failed in the last 7 days",
];

/* ---------------------------------- helpers ---------------------------------- */

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function formatPeriodEnd(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* -------------------------------- formatting -------------------------------- */

function formatCurrency(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

function formatNumber(n: number) {
  return n.toLocaleString("en-US");
}

function usageTone(pct: number): "accent" | "warning" | "danger" {
  if (pct >= 95) return "danger";
  if (pct >= 80) return "warning";
  return "accent";
}

const TONE_BAR: Record<string, string> = {
  accent: "bg-accent",
  warning: "bg-warning",
  danger: "bg-danger",
};

const TONE_TEXT: Record<string, string> = {
  accent: "text-accent",
  warning: "text-warning",
  danger: "text-danger",
};

/* ---------------------------------- chart ----------------------------------- */

function BarChart({
  data,
  caption,
  horizontal,
  currency,
}: {
  data: { label: string; value: number }[];
  caption: string;
  horizontal?: boolean;
  currency?: boolean;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const format = (n: number) => (currency ? formatCurrency(n) : formatNumber(n));

  if (horizontal) {
    return (
      <div className="p-5" role="img" aria-label={caption}>
        <p className="mb-4 text-xs font-mono uppercase tracking-wide text-ink-3">{caption}</p>
        <div className="flex flex-col gap-3">
          {data.map((d) => {
            const pct = (d.value / max) * 100;
            const isMax = d.value === max;
            return (
              <div key={d.label} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-sm text-ink-2" title={d.label}>
                  {d.label}
                </span>
                <div className="relative h-5 flex-1 rounded bg-surface-2">
                  <div
                    className={`h-full rounded ${isMax ? "bg-accent" : "bg-accent/45"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right font-mono text-xs tabular-nums text-ink-2">
                  {format(d.value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5" role="img" aria-label={caption}>
      <p className="mb-4 text-xs font-mono uppercase tracking-wide text-ink-3">{caption}</p>
      <div className="relative flex h-48 items-end gap-6 border-b border-border pb-0">
        {[0, 25, 50, 75].map((line) => (
          <div
            key={line}
            className="pointer-events-none absolute inset-x-0 border-t border-border/60"
            style={{ bottom: `${line}%` }}
          />
        ))}
        {data.map((d) => {
          const pct = (d.value / max) * 100;
          const isMax = d.value === max;
          return (
            <div key={d.label} className="relative z-10 flex h-full flex-1 flex-col items-center justify-end gap-2">
              <span className="font-mono text-xs tabular-nums text-ink-2">{format(d.value)}</span>
              <div
                className={`w-full max-w-14 rounded-t-md ${isMax ? "bg-accent" : "bg-accent/45"}`}
                style={{ height: `${Math.max(pct, 3)}%` }}
              />
              <span className="text-sm text-ink-2">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------- layout ----------------------------------- */

function StatRow({ subscription, used }: { subscription: Subscription; used: number }) {
  const limit = subscription.queryLimit;
  const pct = limit ? Math.round((used / limit) * 100) : 0;
  const tone = usageTone(pct);
  const price =
    subscription.billingCycle === "ANNUAL" ? subscription.annualPrice : subscription.monthlyPrice;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-3">Current plan</p>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-semibold text-ink">{subscription.planName}</span>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
              subscription.status === "ACTIVE"
                ? "border-success/30 bg-success/10 text-success"
                : "border-warning/30 bg-warning/10 text-warning"
            }`}
          >
            {subscription.status === "ACTIVE" ? "Active" : "Canceling"}
          </span>
        </div>
        <p className="text-sm text-ink-2">
          {price !== null ? `${formatCurrency(price)}/mo` : "Custom pricing"} · renews{" "}
          {formatPeriodEnd(subscription.currentPeriodEnd)}
        </p>
        <Link href="/payments" className="mt-1 self-start text-sm text-accent hover:text-accent-2">
          Manage billing →
        </Link>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-3">Queries this cycle</p>
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-2xl tabular-nums text-ink">{formatNumber(used)}</span>
          <span className="font-mono text-sm tabular-nums text-ink-3">
            / {limit ? formatNumber(limit) : "∞"}
          </span>
        </div>
        {limit && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div className={`h-full rounded-full ${TONE_BAR[tone]}`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        )}
        <p className="text-sm text-ink-2">
          {limit ? (
            <>
              <span className={`font-medium ${TONE_TEXT[tone]}`}>{pct}% used</span> · resets{" "}
              {formatPeriodEnd(subscription.currentPeriodEnd)}
            </>
          ) : (
            "Unlimited on your plan"
          )}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-3">Connected data sources</p>
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-2xl tabular-nums text-ink">{DATA_SOURCES.connected}</span>
          <span className="font-mono text-sm tabular-nums text-ink-3">/ {DATA_SOURCES.limit}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DATA_SOURCES.list.map((s) => (
            <span key={s} className="rounded-md border border-border bg-surface-2 px-2 py-1 font-mono text-xs text-ink-2">
              {s}
            </span>
          ))}
        </div>
        <button
          type="button"
          className="mt-1 flex w-fit items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-xs text-ink-2 hover:border-accent/50 hover:text-ink"
        >
          <IconPlus className="h-3 w-3" />
          Connect source
        </button>
      </div>
    </div>
  );
}

function QueryComposer({
  queryText,
  onChangeText,
  onRun,
  isRunning,
  subscription,
  used,
}: {
  queryText: string;
  onChangeText: (v: string) => void;
  onRun: () => void;
  isRunning: boolean;
  subscription: Subscription;
  used: number;
}) {
  const limit = subscription.queryLimit;
  const pct = limit ? Math.round((used / limit) * 100) : 0;
  const tone = usageTone(pct);

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-3">Ask your data</p>
        <button
          type="button"
          className="flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2 py-1 font-mono text-xs text-ink-2 hover:text-ink"
        >
          prod_postgres
          <IconChevron className="h-3 w-3" />
        </button>
      </div>

      <textarea
        value={queryText}
        onChange={(e) => onChangeText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            onRun();
          }
        }}
        placeholder="e.g. Show me monthly revenue by region for the last 6 months"
        rows={2}
        className="w-full resize-none rounded-lg border border-border-strong bg-bg px-4 py-3 font-mono text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-ink-3">Try:</span>
          {EXAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onChangeText(q)}
              className="rounded-full border border-border px-3 py-1 text-xs text-ink-2 transition-colors hover:border-accent/50 hover:text-ink"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden font-mono text-[11px] text-ink-3 sm:inline">⌘⏎</span>
          <button
            type="button"
            onClick={onRun}
            disabled={isRunning || queryText.trim().length === 0}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IconPlay className="h-3.5 w-3.5" />
            {isRunning ? "Running…" : "Run"}
          </button>
        </div>
      </div>

      {limit && pct >= 80 && (
        <div className={`mt-3 flex items-center gap-2 text-xs ${TONE_TEXT[tone]}`}>
          <IconWarning className="h-3.5 w-3.5" />
          <span>
            You&rsquo;re at {pct}% of your monthly query limit.{" "}
            <Link href="/payments" className="text-accent hover:text-accent-2">
              Upgrade plan
            </Link>{" "}
            to keep querying without interruption.
          </span>
        </div>
      )}
    </div>
  );
}

function ResultsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border py-20 text-center">
      <IconDatabase className="h-8 w-8 text-ink-3" />
      <p className="text-sm font-medium text-ink-2">Run a query to see results</p>
      <p className="max-w-xs text-sm text-ink-3">
        Results appear here as a table or chart, alongside the SQL shivecom generated for you.
      </p>
    </div>
  );
}

function ResultsLoading() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-col gap-3">
        {[100, 80, 90, 60].map((w, i) => (
          <div key={i} className="h-4 animate-pulse rounded bg-surface-2" style={{ width: `${w}%` }} />
        ))}
      </div>
      <p className="mt-4 font-mono text-xs text-ink-3">Running query against prod_postgres…</p>
    </div>
  );
}

function ResultsPanel({
  result,
  isRunning,
  view,
  onChangeView,
}: {
  result: QueryResult | null;
  isRunning: boolean;
  view: "table" | "chart";
  onChangeView: (v: "table" | "chart") => void;
}) {
  if (isRunning) return <ResultsLoading />;
  if (!result) return <ResultsEmptyState />;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-wide text-ink-3">You asked</p>
          <p className="truncate text-sm font-medium text-ink">{result.question}</p>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg bg-surface-2 p-0.5">
          <button
            type="button"
            onClick={() => onChangeView("table")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === "table" ? "bg-bg text-ink" : "text-ink-2 hover:text-ink"
            }`}
          >
            <IconTable className="h-3.5 w-3.5" />
            Table
          </button>
          <button
            type="button"
            onClick={() => onChangeView("chart")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === "chart" ? "bg-bg text-ink" : "text-ink-2 hover:text-ink"
            }`}
          >
            <IconBars className="h-3.5 w-3.5" />
            Chart
          </button>
        </div>
      </div>

      {view === "table" ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                {result.columns.map((c) => (
                  <th
                    key={c.key}
                    className={`px-5 py-2.5 font-mono text-xs font-medium uppercase tracking-wide text-ink-3 ${
                      c.numeric ? "text-right" : "text-left"
                    }`}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-surface-2/60">
                  {result.columns.map((c) => {
                    const value = row[c.key];
                    const display =
                      c.numeric && typeof value === "number"
                        ? c.currency
                          ? formatCurrency(value)
                          : formatNumber(value)
                        : value;
                    return (
                      <td
                        key={c.key}
                        className={`px-5 py-2.5 ${
                          c.numeric ? "text-right font-mono tabular-nums text-ink" : "text-ink-2"
                        }`}
                      >
                        {display}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <BarChart
          data={result.chart}
          caption={result.chartCaption}
          horizontal={result.chartHorizontal}
          currency={result.columns.some((c) => c.currency)}
        />
      )}

      <details className="group border-t border-border">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 px-5 py-3 font-mono text-xs text-ink-2 hover:text-ink">
          <IconChevron className="h-3 w-3 transition-transform group-open:rotate-180" />
          View generated SQL
        </summary>
        <pre className="overflow-x-auto whitespace-pre bg-bg/60 px-5 py-4 font-mono text-xs leading-relaxed text-ink-2">
          {result.sql}
        </pre>
      </details>

      <div className="border-t border-border px-5 py-3">
        <p className="font-mono text-xs tabular-nums text-ink-3">{result.rows.length} rows returned</p>
      </div>
    </div>
  );
}

function RecentQueriesRail({
  recentQueries,
  onSelect,
}: {
  recentQueries: RecentQuery[];
  onSelect: (question: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-4">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-medium text-ink">Recent queries</p>
        <span className="font-mono text-xs text-ink-3">{recentQueries.length}</span>
      </div>
      {recentQueries.length === 0 ? (
        <p className="py-3 text-sm text-ink-3">No queries yet — ask something above.</p>
      ) : (
        <ul className="flex flex-col">
          {recentQueries.map((q) => (
            <li key={q.id} className="border-t border-border first:border-0">
              {q.status === "OK" ? (
                <button
                  type="button"
                  onClick={() => onSelect(q.question)}
                  className="flex w-full flex-col gap-1 py-3 text-left"
                >
                  <span className="truncate text-sm text-ink-2 hover:text-ink">{q.question}</span>
                  <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    {timeAgo(q.createdAt)} · {q.rowCount ?? 0} rows
                  </span>
                </button>
              ) : (
                <div className="flex cursor-not-allowed flex-col gap-1 py-3" title="This query failed — no results to show">
                  <span className="truncate text-sm text-ink-3">{q.question}</span>
                  <span className="flex items-center gap-1.5 font-mono text-[11px] text-danger">
                    <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                    {timeAgo(q.createdAt)} · failed
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* --------------------------------- page root --------------------------------- */

export default function ProductsDashboard() {
  const [queryText, setQueryText] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [activeResult, setActiveResult] = useState<QueryResult | null>(null);
  const [view, setView] = useState<"table" | "chart">("table");
  const [runError, setRunError] = useState<string | null>(null);

  const [pageLoading, setPageLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [used, setUsed] = useState(0);
  const [recentQueries, setRecentQueries] = useState<RecentQuery[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [sub, count, recent] = await Promise.all([
          billingApi.subscription(),
          queriesApi.count(),
          queriesApi.recent(),
        ]);
        if (cancelled) return;
        setSubscription(sub);
        setUsed(count.count);
        setRecentQueries(recent);
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function runQuery(question: string) {
    setQueryText(question);
    setIsRunning(true);
    setRunError(null);
    try {
      const result = await queriesApi.ask(question);
      setActiveResult(result);
      setView("table");
      setUsed((u) => u + 1);
      const newRecent: RecentQuery = {
        id: result.id,
        question: result.question,
        status: "OK",
        rowCount: result.rows.length,
        createdAt: result.createdAt,
      };
      setRecentQueries((prev) => [newRecent, ...prev].slice(0, 20));
    } catch (err) {
      setRunError(err instanceof ApiError ? err.message : "Something went wrong running that query.");
    } finally {
      setIsRunning(false);
    }
  }

  function handleRun() {
    const trimmed = queryText.trim();
    if (!trimmed) return;
    void runQuery(trimmed);
  }

  if (pageLoading || !subscription) {
    return (
      <AppShell active="overview" title="Overview">
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      active="overview"
      title="Overview"
      headerRight={
        <Link
          href="/payments"
          className="rounded-lg bg-accent px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Upgrade plan
        </Link>
      }
    >
      <StatRow subscription={subscription} used={used} />
      <QueryComposer
        queryText={queryText}
        onChangeText={setQueryText}
        onRun={handleRun}
        isRunning={isRunning}
        subscription={subscription}
        used={used}
      />
      {runError && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          {runError}
        </p>
      )}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_320px]">
        <ResultsPanel result={activeResult} isRunning={isRunning} view={view} onChangeView={setView} />
        <RecentQueriesRail recentQueries={recentQueries} onSelect={runQuery} />
      </div>
    </AppShell>
  );
}
