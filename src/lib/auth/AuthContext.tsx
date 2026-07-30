"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getMeRequest, loginRequest, logoutRequest, refreshRequest, registerRequest } from "./api";
import { clearStoredRefreshToken, getStoredRefreshToken, setStoredRefreshToken } from "./session";
import type { CurrentUser } from "./types";

type Status = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: Status;
  user: CurrentUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, organizationName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<CurrentUser | null>(null);

  const applySession = useCallback(async (tokens: { accessToken: string; refreshToken: string }) => {
    setStoredRefreshToken(tokens.refreshToken);
    const me = await getMeRequest(tokens.accessToken);
    setUser(me);
    setStatus("authenticated");
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
      return refreshRequest(storedRefreshToken)
        .then(applySession)
        .catch(() => {
          clearStoredRefreshToken();
          setStatus("unauthenticated");
        });
    });
  }, [applySession]);

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
    clearStoredRefreshToken();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(
    () => ({ status, user, login, register, logout }),
    [status, user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
