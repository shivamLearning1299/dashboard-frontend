import type { ApiFetch } from "@/lib/api/fetchJson";
import { fetchJson } from "@/lib/api/fetchJson";

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

export function askQuery(apiFetch: ApiFetch, question: string) {
  return fetchJson<QueryResult>(apiFetch, "/queries", {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}

export function getRecentQueries(apiFetch: ApiFetch) {
  return fetchJson<RecentQuery[]>(apiFetch, "/queries/recent");
}

export function getQueryCount(apiFetch: ApiFetch) {
  return fetchJson<{ count: number }>(apiFetch, "/queries/count");
}
