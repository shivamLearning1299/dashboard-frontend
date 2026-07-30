import { ApiError } from "./errors";

export type ApiFetch = (path: string, init?: RequestInit) => Promise<Response>;

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(", ");
    if (body.message) return body.message;
  } catch {
    // response wasn't JSON — fall through to the generic message below
  }
  return "Something went wrong. Please try again.";
}

/** Calls an authenticated endpoint (via the AuthContext's apiFetch) and
 * parses the JSON body, normalizing failures to ApiError. */
export async function fetchJson<T>(apiFetch: ApiFetch, path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await apiFetch(path, init);
  } catch {
    throw new ApiError(0, "Can't reach the server. Is the API running?");
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseErrorMessage(res));
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
