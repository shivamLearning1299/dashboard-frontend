// Refresh token lives in localStorage so a session survives a page reload;
// the access token is kept in memory only (AuthContext state), never
// persisted. This is a pragmatic MVP choice, not a hardened one — an
// httpOnly cookie set by the backend would remove the localStorage/XSS
// exposure entirely, but that requires a backend change this phase doesn't
// make.
const REFRESH_TOKEN_KEY = "shivecom.refreshToken";

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setStoredRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearStoredRefreshToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}
