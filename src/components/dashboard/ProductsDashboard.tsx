"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import {
  IconChevron,
  IconPlus,
  IconWarning,
  type IconProps,
} from "@/components/icons";

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

/* --------------------------------- mock data -------------------------------- */

const PLAN = {
  tier: "Pro",
  price: "$49/mo",
  renewsOn: "Aug 14, 2026",
};

const USAGE = { used: 8412, limit: 10000, resetsInDays: 15 };

const DATA_SOURCES = {
  connected: 3,
  limit: 5,
  list: ["prod_postgres", "warehouse_bq", "stripe_sync"],
};

type Column = { key: string; label: string; numeric?: boolean; currency?: boolean };

type ResultSet = {
  id: string;
  question: string;
  sql: string;
  columns: Column[];
  rows: Record<string, string | number>[];
  chart: { label: string; value: number }[];
  chartCaption: string;
  chartHorizontal?: boolean;
};

const RESULT_SETS: ResultSet[] = [
  {
    id: "revenue-by-region",
    question: "Monthly revenue by region, last 6 months",
    sql: `SELECT region,
       date_trunc('month', created_at) AS month,
       SUM(amount)::numeric(12,2) AS revenue,
       COUNT(*) AS orders
FROM orders
WHERE created_at >= now() - interval '6 months'
GROUP BY region, month
ORDER BY month, region;`,
    columns: [
      { key: "region", label: "Region" },
      { key: "month", label: "Month" },
      { key: "revenue", label: "Revenue", numeric: true, currency: true },
      { key: "orders", label: "Orders", numeric: true },
    ],
    rows: [
      { region: "NA", month: "Feb", revenue: 128400, orders: 812 },
      { region: "EMEA", month: "Feb", revenue: 94200, orders: 601 },
      { region: "APAC", month: "Feb", revenue: 61300, orders: 388 },
      { region: "NA", month: "Mar", revenue: 141900, orders: 874 },
      { region: "EMEA", month: "Mar", revenue: 101500, orders: 655 },
      { region: "APAC", month: "Mar", revenue: 68900, orders: 421 },
      { region: "NA", month: "Apr", revenue: 156200, orders: 940 },
      { region: "EMEA", month: "Apr", revenue: 108700, orders: 690 },
      { region: "APAC", month: "Apr", revenue: 74800, orders: 459 },
    ],
    chart: [
      { label: "NA", value: 426500 },
      { label: "EMEA", value: 304400 },
      { label: "APAC", value: 205000 },
    ],
    chartCaption: "Revenue by region, 3-month total (USD)",
  },
  {
    id: "top-customers",
    question: "Top customers by lifetime value",
    sql: `SELECT c.name AS customer,
       c.plan,
       SUM(o.amount)::numeric(12,2) AS ltv,
       COUNT(o.id) AS orders
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.name, c.plan
ORDER BY ltv DESC
LIMIT 7;`,
    columns: [
      { key: "customer", label: "Customer" },
      { key: "plan", label: "Plan" },
      { key: "ltv", label: "LTV", numeric: true, currency: true },
      { key: "orders", label: "Orders", numeric: true },
    ],
    rows: [
      { customer: "Northwind Traders", plan: "Enterprise", ltv: 84200, orders: 46 },
      { customer: "Globex Retail", plan: "Enterprise", ltv: 71950, orders: 39 },
      { customer: "Initech Labs", plan: "Pro", ltv: 52300, orders: 61 },
      { customer: "Umbrella Supply", plan: "Pro", ltv: 44100, orders: 28 },
      { customer: "Soylent Foods", plan: "Team", ltv: 31800, orders: 22 },
      { customer: "Hooli Devices", plan: "Team", ltv: 27650, orders: 19 },
      { customer: "Wayne Logistics", plan: "Pro", ltv: 22400, orders: 15 },
    ],
    chart: [
      { label: "Northwind", value: 84200 },
      { label: "Globex", value: 71950 },
      { label: "Initech", value: 52300 },
      { label: "Umbrella", value: 44100 },
      { label: "Soylent", value: 31800 },
      { label: "Hooli", value: 27650 },
      { label: "Wayne", value: 22400 },
    ],
    chartCaption: "Lifetime value by customer (USD)",
    chartHorizontal: true,
  },
  {
    id: "failed-payments",
    question: "Payments that failed in the last 7 days",
    sql: `SELECT o.id AS order_id,
       c.name AS customer,
       o.amount,
       o.failure_reason,
       o.created_at::date AS date
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.status = 'failed'
  AND o.created_at >= now() - interval '7 days'
ORDER BY o.created_at DESC;`,
    columns: [
      { key: "order_id", label: "Order" },
      { key: "customer", label: "Customer" },
      { key: "amount", label: "Amount", numeric: true, currency: true },
      { key: "reason", label: "Failure reason" },
      { key: "date", label: "Date" },
    ],
    rows: [
      { order_id: "#8841", customer: "Hooli Devices", amount: 1200, reason: "Card declined", date: "Jul 28" },
      { order_id: "#8833", customer: "Wayne Logistics", amount: 640, reason: "Insufficient funds", date: "Jul 27" },
      { order_id: "#8820", customer: "Soylent Foods", amount: 2150, reason: "Card declined", date: "Jul 25" },
      { order_id: "#8807", customer: "Umbrella Supply", amount: 980, reason: "Expired card", date: "Jul 24" },
      { order_id: "#8795", customer: "Initech Labs", amount: 315, reason: "Card declined", date: "Jul 23" },
    ],
    chart: [
      { label: "Card declined", value: 3 },
      { label: "Insufficient funds", value: 1 },
      { label: "Expired card", value: 1 },
    ],
    chartCaption: "Failed payments by reason, last 7 days",
    chartHorizontal: true,
  },
];

const RECENT_QUERIES: Array<
  | { kind: "ok"; question: string; time: string; rows: number; datasetIndex: number }
  | { kind: "error"; question: string; time: string }
> = [
  { kind: "ok", question: "Monthly revenue by region, last 6 months", time: "2m ago", rows: 9, datasetIndex: 0 },
  { kind: "ok", question: "Top customers by lifetime value", time: "38m ago", rows: 7, datasetIndex: 1 },
  { kind: "error", question: "orders where region = ''", time: "1h ago" },
  { kind: "ok", question: "Payments that failed in the last 7 days", time: "3h ago", rows: 5, datasetIndex: 2 },
  { kind: "ok", question: "Revenue by region for March only", time: "Yesterday", rows: 9, datasetIndex: 0 },
];

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

function StatRow() {
  const pct = Math.round((USAGE.used / USAGE.limit) * 100);
  const tone = usageTone(pct);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-3">Current plan</p>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-semibold text-ink">{PLAN.tier}</span>
          <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
            Active
          </span>
        </div>
        <p className="text-sm text-ink-2">
          {PLAN.price} · renews {PLAN.renewsOn}
        </p>
        <Link href="/payments" className="mt-1 self-start text-sm text-accent hover:text-accent-2">
          Manage billing →
        </Link>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-3">Queries this cycle</p>
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-2xl tabular-nums text-ink">{formatNumber(USAGE.used)}</span>
          <span className="font-mono text-sm tabular-nums text-ink-3">/ {formatNumber(USAGE.limit)}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div className={`h-full rounded-full ${TONE_BAR[tone]}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-sm text-ink-2">
          <span className={`font-medium ${TONE_TEXT[tone]}`}>{pct}% used</span> · resets in {USAGE.resetsInDays} days
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
}: {
  queryText: string;
  onChangeText: (v: string) => void;
  onRun: () => void;
  isRunning: boolean;
}) {
  const pct = Math.round((USAGE.used / USAGE.limit) * 100);
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
          {RESULT_SETS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onChangeText(r.question)}
              className="rounded-full border border-border px-3 py-1 text-xs text-ink-2 transition-colors hover:border-accent/50 hover:text-ink"
            >
              {r.question}
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

      {pct >= 80 && (
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
  result: ResultSet | null;
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
        <p className="font-mono text-xs tabular-nums text-ink-3">
          {result.rows.length} rows returned in {(180 + result.rows.length * 12) % 900}ms
        </p>
      </div>
    </div>
  );
}

function RecentQueriesRail({ onSelect }: { onSelect: (datasetIndex: number, question: string) => void }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-4">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-medium text-ink">Recent queries</p>
        <span className="font-mono text-xs text-ink-3">{RECENT_QUERIES.length}</span>
      </div>
      <ul className="flex flex-col">
        {RECENT_QUERIES.map((q, i) => (
          <li key={i} className="border-t border-border first:border-0">
            {q.kind === "ok" ? (
              <button
                type="button"
                onClick={() => onSelect(q.datasetIndex, q.question)}
                className="flex w-full flex-col gap-1 py-3 text-left"
              >
                <span className="truncate text-sm text-ink-2 hover:text-ink">{q.question}</span>
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  {q.time} · {q.rows} rows
                </span>
              </button>
            ) : (
              <div className="flex cursor-not-allowed flex-col gap-1 py-3" title="This query failed — no results to show">
                <span className="truncate text-sm text-ink-3">{q.question}</span>
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-danger">
                  <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                  {q.time} · failed
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------------------------------- page root --------------------------------- */

export default function ProductsDashboard() {
  const [queryText, setQueryText] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [view, setView] = useState<"table" | "chart">("table");

  const activeResult = useMemo(
    () => (activeIndex === null ? null : RESULT_SETS[activeIndex]),
    [activeIndex]
  );

  function runDataset(index: number, question: string) {
    setQueryText(question);
    setIsRunning(true);
    setActiveIndex(null);
    window.setTimeout(() => {
      setActiveIndex(index);
      setIsRunning(false);
      setView("table");
    }, 650);
  }

  function handleRun() {
    const trimmed = queryText.trim();
    if (!trimmed) return;
    const matchIndex = RESULT_SETS.findIndex((r) => r.question.toLowerCase() === trimmed.toLowerCase());
    runDataset(matchIndex === -1 ? 0 : matchIndex, trimmed);
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
      <StatRow />
      <QueryComposer queryText={queryText} onChangeText={setQueryText} onRun={handleRun} isRunning={isRunning} />
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_320px]">
        <ResultsPanel result={activeResult} isRunning={isRunning} view={view} onChangeView={setView} />
        <RecentQueriesRail onSelect={runDataset} />
      </div>
    </AppShell>
  );
}
