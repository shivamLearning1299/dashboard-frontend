"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { IconCard, IconCheck, IconDownload, IconX } from "@/components/icons";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  cancelSubscription,
  changePlan,
  getInvoices,
  getPlans,
  getSubscription,
  resumeSubscription,
  type BillingCycle,
  type Invoice,
  type Plan,
  type Subscription,
} from "@/lib/billing/api";

/* -------------------------------- formatting -------------------------------- */

function formatUsd(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const INVOICE_STATUS_STYLE: Record<Invoice["status"], string> = {
  PAID: "border-success/30 bg-success/10 text-success",
  FAILED: "border-danger/30 bg-danger/10 text-danger",
  REFUNDED: "border-border-strong bg-surface-2 text-ink-2",
};

/* --------------------------------- dialog ------------------------------------ */

type DialogState =
  | { kind: "none" }
  | { kind: "change"; plan: Plan; direction: "upgrade" | "downgrade"; billingCycle: BillingCycle }
  | { kind: "cancel" };

function ConfirmDialog({
  state,
  currentPlanName,
  renewsOn,
  pending,
  onClose,
  onConfirm,
}: {
  state: DialogState;
  currentPlanName: string;
  renewsOn: string;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (state.kind === "none") return null;

  const isCancel = state.kind === "cancel";
  const isUpgrade = state.kind === "change" && state.direction === "upgrade";

  const title = isCancel
    ? `Cancel your ${currentPlanName} plan?`
    : state.kind === "change"
      ? `${state.direction === "upgrade" ? "Upgrade" : "Downgrade"} to ${state.plan.name}?`
      : "";

  const body = isCancel
    ? `Your workspace keeps ${currentPlanName} access until ${renewsOn}. You can resume anytime before then.`
    : state.kind === "change"
      ? isUpgrade
        ? `You'll be charged a prorated amount today, then ${
            state.plan.monthlyPrice !== null
              ? `${formatUsd(state.billingCycle === "ANNUAL" ? state.plan.annualPrice ?? 0 : state.plan.monthlyPrice)}/mo`
              : "your custom rate"
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
            disabled={pending}
            className="rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-ink-2 hover:text-ink disabled:opacity-50"
          >
            Never mind
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              isCancel ? "bg-danger hover:bg-danger/85" : "bg-accent hover:bg-accent-2"
            }`}
          >
            {pending ? "Working…" : isCancel ? "Confirm cancellation" : isUpgrade ? "Confirm upgrade" : "Confirm downgrade"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- sections ----------------------------------- */

function CurrentPlanCard({
  subscription,
  onCancel,
  onResume,
}: {
  subscription: Subscription;
  onCancel: () => void;
  onResume: () => void;
}) {
  const active = subscription.status === "ACTIVE";
  const renewsOn = formatDate(subscription.currentPeriodEnd);
  const price = subscription.billingCycle === "ANNUAL" ? subscription.annualPrice : subscription.monthlyPrice;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
      <p className="font-mono text-xs uppercase tracking-wide text-ink-3">Current plan</p>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-semibold text-ink">{subscription.planName}</span>
        {active ? (
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
        {price !== null ? `${formatUsd(price)}/mo` : "Custom pricing"} · {active ? `renews ${renewsOn}` : `ends ${renewsOn}`}
      </p>
      {active ? (
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
          <p className="text-sm font-medium text-ink">Visa •••• 4242</p>
          <p className="font-mono text-xs text-ink-3">Expires 09/27</p>
        </div>
      </div>
      <button type="button" className="mt-1 self-start text-sm text-accent hover:text-accent-2">
        Update payment method
      </button>
    </div>
  );
}

function NextInvoiceCard({ subscription, billedTo }: { subscription: Subscription; billedTo: string }) {
  const price = subscription.billingCycle === "ANNUAL" ? subscription.annualPrice : subscription.monthlyPrice;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
      <p className="font-mono text-xs uppercase tracking-wide text-ink-3">Next invoice</p>
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-2xl tabular-nums text-ink">{price !== null ? formatUsd(price) : "—"}</span>
        <span className="text-sm text-ink-3">due {formatDate(subscription.currentPeriodEnd)}</span>
      </div>
      <p className="text-sm text-ink-2">Billed to {billedTo}</p>
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
  currentPlan,
  onSelect,
}: {
  plan: Plan;
  annual: boolean;
  currentPlan: Plan;
  onSelect: (plan: Plan, direction: "upgrade" | "downgrade") => void;
}) {
  const isCurrent = plan.key === currentPlan.key;
  const isPopular = !isCurrent && plan.key === "pro";
  const price = annual ? plan.annualPrice : plan.monthlyPrice;
  const isUpgrade = plan.sortOrder > currentPlan.sortOrder;

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

      {plan.key === "enterprise" ? (
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
      ) : isUpgrade ? (
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

function BillingHistory({ invoices }: { invoices: Invoice[] }) {
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
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-ink-3">
                  No invoices yet.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-surface-2/60">
                  <td className="px-5 py-2.5 text-ink-2">{formatDate(inv.issuedAt)}</td>
                  <td className="px-5 py-2.5 text-ink-2">{inv.description}</td>
                  <td className="px-5 py-2.5 text-right font-mono tabular-nums text-ink">{formatUsd(inv.amount)}</td>
                  <td className="px-5 py-2.5">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${INVOICE_STATUS_STYLE[inv.status]}`}
                    >
                      {inv.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-md p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink"
                      title={`Download invoice ${inv.id}`}
                    >
                      <IconDownload className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Banner({ tone, message, onDismiss }: { tone: "success" | "danger"; message: string; onDismiss: () => void }) {
  const toneClasses =
    tone === "success"
      ? "border-success/30 bg-success/10 text-success"
      : "border-danger/30 bg-danger/10 text-danger";
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${toneClasses}`}>
      <div className="flex items-center gap-2">
        <IconCheck className="h-4 w-4" />
        {message}
      </div>
      <button type="button" onClick={onDismiss} className="opacity-70 hover:opacity-100">
        <IconX className="h-4 w-4" />
      </button>
    </div>
  );
}

/* --------------------------------- page root --------------------------------- */

export default function PaymentsDashboard() {
  const { apiFetch, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [annual, setAnnual] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });
  const [dialogPending, setDialogPending] = useState(false);
  const [banner, setBanner] = useState<{ tone: "success" | "danger"; message: string } | null>(null);

  useEffect(() => {
    Promise.all([getPlans(apiFetch), getSubscription(apiFetch), getInvoices(apiFetch)])
      .then(([plansRes, subRes, invoicesRes]) => {
        setPlans(plansRes);
        setSubscription(subRes);
        setInvoices(invoicesRes);
        setAnnual(subRes.billingCycle === "ANNUAL");
      })
      .catch(() => setLoadError("Couldn't load billing information. Try refreshing the page."))
      .finally(() => setLoading(false));
  }, [apiFetch]);

  function closeDialog() {
    if (dialogPending) return;
    setDialog({ kind: "none" });
  }

  async function confirmDialog() {
    setDialogPending(true);
    try {
      if (dialog.kind === "change") {
        const updated = await changePlan(apiFetch, dialog.plan.key as "starter" | "pro" | "business", dialog.billingCycle);
        setSubscription(updated);
        setBanner({
          tone: "success",
          message: `You're now on the ${dialog.plan.name} plan. Changes apply immediately.`,
        });
        setInvoices(await getInvoices(apiFetch));
      } else if (dialog.kind === "cancel") {
        setSubscription(await cancelSubscription(apiFetch));
      }
      setDialog({ kind: "none" });
    } catch {
      setBanner({ tone: "danger", message: "That didn't go through. Please try again." });
    } finally {
      setDialogPending(false);
    }
  }

  async function handleResume() {
    try {
      setSubscription(await resumeSubscription(apiFetch));
    } catch {
      setBanner({ tone: "danger", message: "Couldn't resume your plan. Please try again." });
    }
  }

  if (loading) {
    return (
      <AppShell active="payments" title="Payments">
        <div className="flex flex-1 items-center justify-center text-sm text-ink-3">Loading billing…</div>
      </AppShell>
    );
  }

  const currentPlan = plans.find((p) => p.key === subscription?.planKey);

  if (loadError || !subscription || !currentPlan) {
    return (
      <AppShell active="payments" title="Payments">
        <div className="flex flex-1 items-center justify-center text-sm text-danger">
          {loadError ?? "No billing information available."}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell active="payments" title="Payments">
      {banner && <Banner tone={banner.tone} message={banner.message} onDismiss={() => setBanner(null)} />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <CurrentPlanCard
          subscription={subscription}
          onCancel={() => setDialog({ kind: "cancel" })}
          onResume={handleResume}
        />
        <PaymentMethodCard />
        <NextInvoiceCard subscription={subscription} billedTo={user?.email ?? ""} />
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
          {plans.map((plan) => (
            <PlanCard
              key={plan.key}
              plan={plan}
              annual={annual}
              currentPlan={currentPlan}
              onSelect={(p, direction) =>
                setDialog({ kind: "change", plan: p, direction, billingCycle: annual ? "ANNUAL" : "MONTHLY" })
              }
            />
          ))}
        </div>
      </div>

      <BillingHistory invoices={invoices} />

      <ConfirmDialog
        state={dialog}
        currentPlanName={subscription.planName}
        renewsOn={formatDate(subscription.currentPeriodEnd)}
        pending={dialogPending}
        onClose={closeDialog}
        onConfirm={confirmDialog}
      />
    </AppShell>
  );
}
