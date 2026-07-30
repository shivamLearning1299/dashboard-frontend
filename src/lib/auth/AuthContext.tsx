"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getMeRequest, loginRequest, logoutRequest, refreshRequest, registerRequest } from "./api";
import { clearStoredRefreshToken, getStoredRefreshToken, setStoredRefreshToken } from "./session";
import type { CurrentUser } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type Status = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: Status;
  user: CurrentUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, organizationName: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Authenticated fetch: attaches the access token, retries once via
   * refresh on a 401, and signs the session out if that retry also fails. */
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const accessTokenRef = useRef<string | null>(null);

  const applySession = useCallback(async (tokens: { accessToken: string; refreshToken: string }) => {
    accessTokenRef.current = tokens.accessToken;
    setStoredRefreshToken(tokens.refreshToken);
    const me = await getMeRequest(tokens.accessToken);
    setUser(me);
    setStatus("authenticated");
  }, []);

  const signOutLocally = useCallback(() => {
    accessTokenRef.current = null;
    clearStoredRefreshToken();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    // Every setState below runs inside a .then()/.catch() continuation, never
    // synchronously in the effect body itself — this is session rehydration
    // reacting to an async check, not a derived-state calculation.
    Promise.resolve(getStoredRefreshToken()).then((storedRefreshToken) => {
      if (!storedRefreshToken) {
        setStatus("unauthenticated");
        return undefined;
      }
      return refreshRequest(storedRefreshToken).then(applySession).catch(signOutLocally);
    });
  }, [applySession, signOutLocally]);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await loginRequest(email, password);
      await applySession(tokens);
    },
    [applySession],
  );

  const register = useCallback(
    async (email: string, password: string, organizationName: string) => {
      const tokens = await registerRequest(email, password, organizationName);
      await applySession(tokens);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    const storedRefreshToken = getStoredRefreshToken();
    if (storedRefreshToken) {
      await logoutRequest(storedRefreshToken).catch(() => {
        // best-effort — the token may already be expired/revoked server-side;
        // the session gets cleared locally regardless.
      });
    }
    signOutLocally();
  }, [signOutLocally]);

  const apiFetch = useCallback(
    async (path: string, init: RequestInit = {}): Promise<Response> => {
      const doFetch = () =>
        fetch(`${API_URL}${path}`, {
          ...init,
          headers: {
            "Content-Type": "application/json",
            ...init.headers,
            ...(accessTokenRef.current ? { Authorization: `Bearer ${accessTokenRef.current}` } : {}),
          },
        });

      let res = await doFetch();
      if (res.status !== 401) return res;

      const storedRefreshToken = getStoredRefreshToken();
      if (!storedRefreshToken) {
        signOutLocally();
        return res;
      }
      try {
        const tokens = await refreshRequest(storedRefreshToken);
        accessTokenRef.current = tokens.accessToken;
        setStoredRefreshToken(tokens.refreshToken);
        res = await doFetch();
      } catch {
        signOutLocally();
      }
      return res;
    },
    [signOutLocally],
  );

  const value = useMemo(
    () => ({ status, user, login, register, logout, apiFetch }),
    [status, user, login, register, logout, apiFetch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
