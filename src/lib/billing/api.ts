import type { ApiFetch } from "@/lib/api/fetchJson";
import { fetchJson } from "@/lib/api/fetchJson";

export type PlanKey = "starter" | "pro" | "business" | "enterprise";
export type BillingCycle = "MONTHLY" | "ANNUAL";

export interface Plan {
  key: PlanKey;
  name: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  description: string;
  features: string[];
  queryLimit: number | null;
  sortOrder: number;
}

export interface Subscription {
  planKey: PlanKey;
  planName: string;
  status: "ACTIVE" | "CANCELING";
  billingCycle: BillingCycle;
  currentPeriodEnd: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  queryLimit: number | null;
}

export interface Invoice {
  id: string;
  amount: number;
  status: "PAID" | "FAILED" | "REFUNDED";
  description: string;
  issuedAt: string;
}

export function getPlans(apiFetch: ApiFetch) {
  return fetchJson<Plan[]>(apiFetch, "/billing/plans");
}

export function getSubscription(apiFetch: ApiFetch) {
  return fetchJson<Subscription>(apiFetch, "/billing/subscription");
}

export function changePlan(apiFetch: ApiFetch, planKey: "starter" | "pro" | "business", billingCycle: BillingCycle) {
  return fetchJson<Subscription>(apiFetch, "/billing/subscription/change", {
    method: "POST",
    body: JSON.stringify({ planKey, billingCycle }),
  });
}

export function cancelSubscription(apiFetch: ApiFetch) {
  return fetchJson<Subscription>(apiFetch, "/billing/subscription/cancel", { method: "POST" });
}

export function resumeSubscription(apiFetch: ApiFetch) {
  return fetchJson<Subscription>(apiFetch, "/billing/subscription/resume", { method: "POST" });
}

export function getInvoices(apiFetch: ApiFetch) {
  return fetchJson<Invoice[]>(apiFetch, "/billing/invoices");
}
