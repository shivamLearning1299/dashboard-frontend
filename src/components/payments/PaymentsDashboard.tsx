"use client";

import { useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { IconCard, IconCheck, IconDownload, IconX } from "@/components/icons";

/* --------------------------------- mock data -------------------------------- */

type PlanId = "starter" | "pro" | "business" | "enterprise";

const TIER_ORDER: PlanId[] = ["starter", "pro", "business", "enterprise"];

type Plan = {
  id: PlanId;
  name: string;
  monthly: number | null;
  annual: number | null;
  description: string;
  features: string[];
};

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    monthly: 0,
    annual: 0,
    description: "For solo builders trying shivecom out.",
    features: ["500 AI queries / month", "1 connected data source", "Community support", "7-day query history"],
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 49,
    annual: 39,
    description: "For small teams shipping on real data.",
    features: [
      "10,000 AI queries / month",
      "5 connected data sources",
      "Team messaging",
      "Priority email support",
      "Saved & scheduled queries",
    ],
  },
  {
    id: "business",
    name: "Business",
    monthly: 199,
    annual: 159,
    description: "For growing teams with compliance needs.",
    features: [
      "50,000 AI queries / month",
      "Unlimited data sources",
      "SSO & audit logs",
      "Dedicated Slack channel",
      "99.9% uptime SLA",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthly: null,
    annual: null,
    description: "For large orgs with custom requirements.",
    features: [
      "Unlimited AI queries",
      "Custom data residency",
      "Dedicated infrastructure",
      "Custom SLA & onboarding",
    ],
  },
];

const PLAN_LOOKUP: Record<PlanId, Plan> = Object.fromEntries(PLANS.map((p) => [p.id, p])) as Record<PlanId, Plan>;

const PAYMENT_METHOD = { brand: "Visa", last4: "4242", expiry: "09/27" };

type InvoiceStatus = "paid" | "failed" | "refunded";

type Invoice = {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: InvoiceStatus;
};

const INVOICES: Invoice[] = [
  { id: "INV-2091", date: "Jul 14, 2026", description: "Pro plan · Jul 14 – Aug 14", amount: 49, status: "paid" },
  { id: "INV-2077", date: "Jun 14, 2026", description: "Pro plan · Jun 14 – Jul 14", amount: 49, status: "paid" },
  { id: "INV-2054", date: "May 14, 2026", description: "Pro plan · May 14 – Jun 14", amount: 49, status: "paid" },
  { id: "INV-2033", date: "Apr 14, 2026", description: "Pro plan · Apr 14 – May 14", amount: 49, status: "failed" },
  { id: "INV-2033-R", date: "Apr 16, 2026", description: "Pro plan · Apr 14 – May 14 (retry)", amount: 49, status: "paid" },
  { id: "INV-2011", date: "Mar 14, 2026", description: "Starter → Pro, prorated upgrade", amount: 18, status: "paid" },
];

const INVOICE_STATUS_STYLE: Record<InvoiceStatus, string> = {
  paid: "border-success/30 bg-success/10 text-success",
  failed: "border-danger/30 bg-danger/10 text-danger",
  refunded: "border-border-strong bg-surface-2 text-ink-2",
};

/* -------------------------------- formatting -------------------------------- */

function formatUsd(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

function tierIndex(id: PlanId) {
  return TIER_ORDER.indexOf(id);
}

/* --------------------------------- dialog ------------------------------------ */

type DialogState =
  | { kind: "none" }
  | { kind: "change"; plan: Plan; direction: "upgrade" | "downgrade" }
  | { kind: "cancel" };

function ConfirmDialog({
  state,
  renewsOn,
  onClose,
  onConfirm,
}: {
  state: DialogState;
  renewsOn: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (state.kind === "none") return null;

  const isCancel = state.kind === "cancel";
  const isUpgrade = state.kind === "change" && state.direction === "upgrade";

  const title = isCancel
    ? "Cancel your Pro plan?"
    : state.kind === "change"
      ? `${state.direction === "upgrade" ? "Upgrade" : "Downgrade"} to ${state.plan.name}?`
      : "";

  const body = isCancel
    ? `Your workspace keeps Pro access until ${renewsOn}, then moves to Starter. You can resume anytime before then.`
    : state.kind === "change"
      ? isUpgrade
        ? `You'll be charged a prorated amount today, then ${
            state.plan.monthly !== null ? `${formatUsd(state.plan.monthly)}/mo` : "your custom rate"
          } going forward.`
        : `Your plan changes at the end of the current billing cycle on ${renewsOn}. No refund is issued for the current period.`
      : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6">
        <h2 id="confirm-dialog-title" className="text-base font-semibold text-ink">
          {title}
        </h2>
        <p className="mt-2 text-sm text-ink-2">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-ink-2 hover:text-ink"
          >
            Never mind
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium text-white transition-colors ${
              isCancel ? "bg-danger hover:bg-danger/85" : "bg-accent hover:bg-accent-2"
            }`}
          >
            {isCancel ? "Confirm cancellation" : isUpgrade ? "Confirm upgrade" : "Confirm downgrade"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- sections ----------------------------------- */

function CurrentPlanCard({
  currentPlan,
  status,
  renewsOn,
  onCancel,
  onResume,
}: {
  currentPlan: Plan;
  status: "active" | "canceling";
  renewsOn: string;
  onCancel: () => void;
  onResume: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
      <p className="font-mono text-xs uppercase tracking-wide text-ink-3">Current plan</p>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-semibold text-ink">{currentPlan.name}</span>
        {status === "active" ? (
          <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
            Active
          </span>
        ) : (
          <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
            Cancels {renewsOn}
          </span>
        )}
      </div>
      <p className="text-sm text-ink-2">
        {currentPlan.monthly !== null ? `${formatUsd(currentPlan.monthly)}/mo` : "Custom pricing"} ·{" "}
        {status === "active" ? `renews ${renewsOn}` : `ends ${renewsOn}`}
      </p>
      {status === "active" ? (
        <button type="button" onClick={onCancel} className="mt-1 self-start text-sm text-ink-3 hover:text-danger">
          Cancel plan
        </button>
      ) : (
        <button type="button" onClick={onResume} className="mt-1 self-start text-sm text-accent hover:text-accent-2">
          Resume plan
        </button>
      )}
    </div>
  );
}

function PaymentMethodCard() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
      <p className="font-mono text-xs uppercase tracking-wide text-ink-3">Payment method</p>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-2 text-ink-2">
          <IconCard className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-medium text-ink">
            {PAYMENT_METHOD.brand} •••• {PAYMENT_METHOD.last4}
          </p>
          <p className="font-mono text-xs text-ink-3">Expires {PAYMENT_METHOD.expiry}</p>
        </div>
      </div>
      <button type="button" className="mt-1 self-start text-sm text-accent hover:text-accent-2">
        Update payment method
      </button>
    </div>
  );
}

function NextInvoiceCard({ currentPlan, renewsOn }: { currentPlan: Plan; renewsOn: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
      <p className="font-mono text-xs uppercase tracking-wide text-ink-3">Next invoice</p>
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-2xl tabular-nums text-ink">
          {currentPlan.monthly !== null ? formatUsd(currentPlan.monthly) : "—"}
        </span>
        <span className="text-sm text-ink-3">due {renewsOn}</span>
      </div>
      <p className="text-sm text-ink-2">Billed to priya@acme.dev</p>
    </div>
  );
}

function BillingCycleToggle({ annual, onChange }: { annual: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-surface-2 p-0.5">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          !annual ? "bg-bg text-ink" : "text-ink-2 hover:text-ink"
        }`}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          annual ? "bg-bg text-ink" : "text-ink-2 hover:text-ink"
        }`}
      >
        Annual
        <span className="rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">
          Save 20%
        </span>
      </button>
    </div>
  );
}

function PlanCard({
  plan,
  annual,
  currentPlanId,
  onSelect,
}: {
  plan: Plan;
  annual: boolean;
  currentPlanId: PlanId;
  onSelect: (plan: Plan, direction: "upgrade" | "downgrade") => void;
}) {
  const isCurrent = plan.id === currentPlanId;
  const isPopular = !isCurrent && plan.id === "pro";
  const diff = tierIndex(plan.id) - tierIndex(currentPlanId);
  const price = annual ? plan.annual : plan.monthly;

  return (
    <div
      className={`flex flex-col gap-4 rounded-xl border bg-surface p-5 ${
        isCurrent ? "border-accent/50 ring-1 ring-accent/40" : "border-border"
      }`}
    >
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-ink">{plan.name}</p>
          {isCurrent && (
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
              Current plan
            </span>
          )}
          {isPopular && (
            <span className="rounded-full border border-border-strong bg-surface-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-2">
              Popular
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-ink-3">{plan.description}</p>
      </div>

      <div>
        {price !== null ? (
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-3xl tabular-nums text-ink">{formatUsd(price)}</span>
            <span className="text-sm text-ink-3">/mo</span>
          </div>
        ) : (
          <span className="font-mono text-3xl text-ink">Custom</span>
        )}
        {annual && price !== null && price > 0 && (
          <p className="mt-0.5 font-mono text-xs text-ink-3">billed {formatUsd(price * 12)}/yr</p>
        )}
      </div>

      <ul className="flex flex-1 flex-col gap-2">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-ink-2">
            <IconCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
            {f}
          </li>
        ))}
      </ul>

      {plan.id === "enterprise" ? (
        <a
          href="mailto:sales@shivecom.dev?subject=Enterprise%20plan"
          className="rounded-lg border border-border py-2 text-center text-sm font-medium text-ink transition-colors hover:border-border-strong"
        >
          Contact sales
        </a>
      ) : isCurrent ? (
        <button
          type="button"
          disabled
          className="cursor-default rounded-lg bg-surface-2 py-2 text-sm font-medium text-ink-2"
        >
          Current plan
        </button>
      ) : diff > 0 ? (
        <button
          type="button"
          onClick={() => onSelect(plan, "upgrade")}
          className="rounded-lg bg-accent py-2 text-sm font-medium text-white transition-colors hover:bg-accent-2"
        >
          Upgrade
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onSelect(plan, "downgrade")}
          className="rounded-lg border border-border py-2 text-sm font-medium text-ink-2 transition-colors hover:border-border-strong hover:text-ink"
        >
          Downgrade
        </button>
      )}
    </div>
  );
}

function BillingHistory() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <p className="text-sm font-medium text-ink">Billing history</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              <th className="px-5 py-2.5 text-left font-mono text-xs font-medium uppercase tracking-wide text-ink-3">
                Date
              </th>
              <th className="px-5 py-2.5 text-left font-mono text-xs font-medium uppercase tracking-wide text-ink-3">
                Description
              </th>
              <th className="px-5 py-2.5 text-right font-mono text-xs font-medium uppercase tracking-wide text-ink-3">
                Amount
              </th>
              <th className="px-5 py-2.5 text-left font-mono text-xs font-medium uppercase tracking-wide text-ink-3">
                Status
              </th>
              <th className="px-5 py-2.5 text-right font-mono text-xs font-medium uppercase tracking-wide text-ink-3">
                Invoice
              </th>
            </tr>
          </thead>
          <tbody>
            {INVOICES.map((inv) => (
              <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-surface-2/60">
                <td className="px-5 py-2.5 text-ink-2">{inv.date}</td>
                <td className="px-5 py-2.5 text-ink-2">{inv.description}</td>
                <td className="px-5 py-2.5 text-right font-mono tabular-nums text-ink">{formatUsd(inv.amount)}</td>
                <td className="px-5 py-2.5">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${INVOICE_STATUS_STYLE[inv.status]}`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="px-5 py-2.5 text-right">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink"
                    title={`Download ${inv.id}.pdf`}
                  >
                    <IconDownload className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Banner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
      <div className="flex items-center gap-2">
        <IconCheck className="h-4 w-4" />
        {message}
      </div>
      <button type="button" onClick={onDismiss} className="text-success/70 hover:text-success">
        <IconX className="h-4 w-4" />
      </button>
    </div>
  );
}

/* --------------------------------- page root --------------------------------- */

const RENEWS_ON = "Aug 14, 2026";

export default function PaymentsDashboard() {
  const [currentPlanId, setCurrentPlanId] = useState<PlanId>("pro");
  const [status, setStatus] = useState<"active" | "canceling">("active");
  const [annual, setAnnual] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });
  const [banner, setBanner] = useState<string | null>(null);

  const currentPlan = PLAN_LOOKUP[currentPlanId];

  function closeDialog() {
    setDialog({ kind: "none" });
  }

  function confirmDialog() {
    if (dialog.kind === "change") {
      setCurrentPlanId(dialog.plan.id);
      setStatus("active");
      setBanner(`You're now on the ${dialog.plan.name} plan. Changes apply immediately.`);
    } else if (dialog.kind === "cancel") {
      setStatus("canceling");
    }
    closeDialog();
  }

  return (
    <AppShell active="payments" title="Payments">
      {banner && <Banner message={banner} onDismiss={() => setBanner(null)} />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <CurrentPlanCard
          currentPlan={currentPlan}
          status={status}
          renewsOn={RENEWS_ON}
          onCancel={() => setDialog({ kind: "cancel" })}
          onResume={() => setStatus("active")}
        />
        <PaymentMethodCard />
        <NextInvoiceCard currentPlan={currentPlan} renewsOn={RENEWS_ON} />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-ink">Plans</p>
            <p className="text-sm text-ink-3">Switch anytime — changes are prorated automatically.</p>
          </div>
          <BillingCycleToggle annual={annual} onChange={setAnnual} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              annual={annual}
              currentPlanId={currentPlanId}
              onSelect={(p, direction) => setDialog({ kind: "change", plan: p, direction })}
            />
          ))}
        </div>
      </div>

      <BillingHistory />

      <ConfirmDialog state={dialog} renewsOn={RENEWS_ON} onClose={closeDialog} onConfirm={confirmDialog} />
    </AppShell>
  );
}
