"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { ApiError } from "@/lib/auth/api";

/* ---------------------------------- icons ---------------------------------- */

type IconProps = { className?: string };

function IconGithub({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

function IconGoogle({ className }: IconProps) {
  return (
    <svg viewBox="0 0 18 18" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" />
    </svg>
  );
}

function IconEye({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <path d="M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconEyeOff({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <path d="M2.5 2.5l15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8.3 5.1c.55-.1 1.13-.16 1.7-.16 5.5 0 8.5 5.5 8.5 5.5a13.6 13.6 0 0 1-2.9 3.6M5.6 6.4A13.5 13.5 0 0 0 1.5 10s3 5.5 8.5 5.5c1.1 0 2.13-.22 3.06-.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.2 11.8a2.4 2.4 0 0 0 3.3-3.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSpinner({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={`animate-spin ${className ?? ""}`} fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path d="M17.5 10a7.5 7.5 0 0 0-7.5-7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconCheck({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 10.2l2.3 2.3 4.7-4.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* --------------------------------- shared bits ------------------------------- */

function Glow() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-accent/20 blur-3xl"
    />
  );
}

function BrandMark() {
  return (
    <div className="mb-8 flex flex-col items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
        s
      </span>
      <span className="font-mono text-sm tracking-wide text-ink-2">shivecom</span>
    </div>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4 py-16">
      <Glow />
      <div className="relative w-full max-w-sm">{children}</div>
    </div>
  );
}

/* ---------------------------------- login ------------------------------------ */

type Mode = "login" | "register";
type Pending = null | "submit" | "github" | "google";

export function LoginScreen() {
  const router = useRouter();
  const { login, register, status } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; organizationName?: string }>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  function toggleMode() {
    setMode((m) => (m === "login" ? "register" : "login"));
    setErrors({});
    setNotice(null);
  }

  function handleOAuth(provider: "github" | "google") {
    if (pending) return;
    setNotice(
      `${provider === "github" ? "GitHub" : "Google"} sign-in isn't connected yet — use email and password below.`,
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    setNotice(null);

    const nextErrors: { email?: string; password?: string; organizationName?: string } = {};
    if (!email.trim()) nextErrors.email = "Enter your email";
    else if (!email.includes("@")) nextErrors.email = "Enter a valid email address";
    if (!password) nextErrors.password = "Enter your password";
    else if (mode === "register" && password.length < 8) nextErrors.password = "Password must be at least 8 characters";
    if (mode === "register" && !organizationName.trim()) nextErrors.organizationName = "Enter your organization's name";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPending("submit");
    try {
      if (mode === "register") {
        await register(email, password, organizationName);
      } else {
        await login(email, password);
      }
      // Redirect happens via the `status === "authenticated"` effect above.
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      setErrors((prev) => ({ ...prev, password: message }));
      setPending(null);
    }
  }

  const disabled = pending !== null;

  return (
    <AuthShell>
      <BrandMark />

      <div className="rounded-xl border border-border bg-surface p-8">
        <h1 className="mb-1 text-lg font-semibold text-ink">
          {mode === "login" ? "Sign in to your workspace" : "Create your workspace"}
        </h1>
        <p className="mb-6 text-sm text-ink-2">
          {mode === "login"
            ? "Query your data, manage billing, and message your team."
            : "Start querying your data in minutes."}
        </p>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => handleOAuth("github")}
            disabled={disabled}
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-2 py-2.5 text-sm font-medium text-ink transition-colors hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            <IconGithub className="h-4 w-4" />
            Continue with GitHub
          </button>
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={disabled}
            className="flex items-center justify-center gap-2 rounded-lg border border-[#DADCE0] bg-white py-2.5 text-sm font-medium text-[#1F1F1F] transition-colors hover:bg-[#F8F9FA] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <IconGoogle className="h-4 w-4" />
            Continue with Google
          </button>
        </div>

        {notice && <p className="mt-3 text-center text-xs text-ink-3">{notice}</p>}

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="font-mono text-[11px] uppercase tracking-wide text-ink-3">or continue with email</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {mode === "register" && (
            <div>
              <label htmlFor="organizationName" className="mb-1.5 block text-xs font-medium text-ink-2">
                Organization name
              </label>
              <input
                id="organizationName"
                type="text"
                autoComplete="organization"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                disabled={disabled}
                aria-invalid={Boolean(errors.organizationName)}
                aria-describedby={errors.organizationName ? "organizationName-error" : undefined}
                placeholder="Acme Analytics"
                className="w-full rounded-lg border border-border-strong bg-bg px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40 disabled:opacity-60"
              />
              {errors.organizationName && (
                <p id="organizationName-error" className="mt-1.5 text-xs text-danger">
                  {errors.organizationName}
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-ink-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={disabled}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              placeholder="you@company.com"
              className="w-full rounded-lg border border-border-strong bg-bg px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40 disabled:opacity-60"
            />
            {errors.email && (
              <p id="email-error" className="mt-1.5 text-xs text-danger">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="block text-xs font-medium text-ink-2">
                Password
              </label>
              {mode === "login" && (
                <button type="button" className="text-xs text-accent hover:text-accent-2">
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={disabled}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "password-error" : undefined}
                placeholder="••••••••"
                className="w-full rounded-lg border border-border-strong bg-bg px-3.5 py-2.5 pr-10 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={disabled}
                className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-ink-3 hover:text-ink-2"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="mt-1.5 text-xs text-danger">
                {errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={disabled}
            className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending === "submit" && <IconSpinner className="h-4 w-4" />}
            {mode === "login"
              ? pending === "submit"
                ? "Signing in…"
                : "Sign in"
              : pending === "submit"
                ? "Creating workspace…"
                : "Create workspace"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-2">
          {mode === "login" ? (
            <>
              Don&rsquo;t have an account?{" "}
              <button type="button" onClick={toggleMode} className="text-accent hover:text-accent-2">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" onClick={toggleMode} className="text-accent hover:text-accent-2">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>

      <p className="mt-8 text-center font-mono text-[11px] text-ink-3">
        SOC 2 Type II · SSO available on Enterprise
      </p>
    </AuthShell>
  );
}

/* ------------------------------- logged out ----------------------------------- */

export function LoggedOutScreen() {
  const { logout } = useAuth();

  useEffect(() => {
    void logout();
  }, [logout]);

  return (
    <AuthShell>
      <BrandMark />

      <div className="flex flex-col items-center rounded-xl border border-border bg-surface p-8 text-center">
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-success/10 text-success">
          <IconCheck className="h-6 w-6" />
        </span>
        <h1 className="text-lg font-semibold text-ink">You&rsquo;ve been signed out</h1>
        <p className="mt-2 text-sm text-ink-2">
          Come back soon — your workspace, connected data sources, and saved queries will be right where you left
          them.
        </p>

        <Link
          href="/login"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-2"
        >
          Sign back in
        </Link>
      </div>
    </AuthShell>
  );
}
