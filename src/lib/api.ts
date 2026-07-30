const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const ACCESS_KEY = "shivecom_access_token";
const REFRESH_KEY = "shivecom_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function rawRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (body.message) {
        message = Array.isArray(body.message) ? body.message.join(", ") : body.message;
      }
    } catch {
      // response had no JSON body — fall back to statusText
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  if (!refreshPromise) {
    refreshPromise = rawRequest<TokenPair>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    })
      .then((tokens) => {
        setTokens(tokens.accessToken, tokens.refreshToken);
        return true;
      })
      .catch(() => {
        clearTokens();
        return false;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// Authenticated request: attaches the access token, and on a 401 tries a
// single refresh-then-retry before giving up (so an expired 15-minute access
// token doesn't force a full re-login as long as the refresh token is valid).
async function authedRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  try {
    return await rawRequest<T>(path, options, token);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && token) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        return rawRequest<T>(path, options, getAccessToken());
      }
    }
    throw err;
  }
}

/* ------------------------------------ auth ----------------------------------- */

export const authApi = {
  register: (email: string, password: string, organizationName: string) =>
    rawRequest<TokenPair>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, organizationName }),
    }),
  login: (email: string, password: string) =>
    rawRequest<TokenPair>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: (refreshToken: string) =>
    rawRequest<void>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),
};

/* ----------------------------------- users ------------------------------------ */

export interface OrgMembership {
  orgId: string;
  role: "ADMIN" | "MEMBER";
  createdAt: string;
  org: { id: string; name: string };
}

export interface Me {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  organizations: OrgMembership[];
}

export const usersApi = {
  me: () => authedRequest<Me>("/users/me"),
};

/* ---------------------------------- billing ------------------------------------ */

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
  status: "ACTIVE" | "CANCELING" | "CANCELED";
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

export const billingApi = {
  plans: () => authedRequest<Plan[]>("/billing/plans"),
  subscription: () => authedRequest<Subscription>("/billing/subscription"),
  changePlan: (planKey: "starter" | "pro" | "business", billingCycle: BillingCycle) =>
    authedRequest<Subscription>("/billing/subscription/change", {
      method: "POST",
      body: JSON.stringify({ planKey, billingCycle }),
    }),
  cancel: () => authedRequest<Subscription>("/billing/subscription/cancel", { method: "POST" }),
  resume: () => authedRequest<Subscription>("/billing/subscription/resume", { method: "POST" }),
  invoices: () => authedRequest<Invoice[]>("/billing/invoices"),
};

/* --------------------------------- messaging ----------------------------------- */

export interface ChannelSummary {
  id: string;
  kind: "CHANNEL" | "DM";
  name: string;
  description: string | null;
  unreadCount: number;
}

export interface MessageDto {
  id: string;
  senderType: "USER" | "AI" | "SYSTEM";
  senderEmail: string | null;
  text: string;
  aiTag: "Alert" | "Answer" | null;
  resultJson: { caption: string; rows: { label: string; value: string }[] } | null;
  createdAt: string;
}

export const messagingApi = {
  listChannels: () =>
    authedRequest<{ channels: ChannelSummary[]; directMessages: ChannelSummary[] }>("/channels"),
  getMessages: (channelId: string) =>
    authedRequest<MessageDto[]>(`/channels/${channelId}/messages`),
  sendMessage: (channelId: string, text: string) =>
    authedRequest<MessageDto>(`/channels/${channelId}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  askAi: (channelId: string, text: string) =>
    authedRequest<{ userMessage: MessageDto; aiMessage: MessageDto }>(
      `/channels/${channelId}/ask-ai`,
      { method: "POST", body: JSON.stringify({ text }) }
    ),
};

/* ---------------------------------- queries ------------------------------------ */

export interface QueryColumn {
  key: string;
  label: string;
  numeric?: boolean;
  currency?: boolean;
}

export interface QueryResult {
  id: string;
  question: string;
  createdAt: string;
  matchedTopic: string;
  sql: string;
  columns: QueryColumn[];
  rows: Record<string, string | number>[];
  chart: { label: string; value: number }[];
  chartCaption: string;
  chartHorizontal?: boolean;
}

export interface RecentQuery {
  id: string;
  question: string;
  status: "OK" | "ERROR";
  rowCount: number | null;
  createdAt: string;
}

export const queriesApi = {
  ask: (question: string) =>
    authedRequest<QueryResult>("/queries", {
      method: "POST",
      body: JSON.stringify({ question }),
    }),
  recent: () => authedRequest<RecentQuery[]>("/queries/recent"),
  count: () => authedRequest<{ count: number }>("/queries/count"),
};
