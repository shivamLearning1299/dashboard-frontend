"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { IconBox, IconCard, IconGrid, IconLogOut, IconMessage, type IconProps } from "@/components/icons";
import { useAuth } from "@/lib/auth-context";

export type NavKey = "overview" | "payments" | "messages" | "catalog";

const NAV_ITEMS: {
  key: NavKey;
  label: string;
  href: string;
  icon: (props: IconProps) => ReactNode;
}[] = [
  { key: "overview", label: "Overview", href: "/", icon: IconGrid },
  { key: "catalog", label: "Catalog", href: "/catalog", icon: IconBox },
  { key: "payments", label: "Payments", href: "/payments", icon: IconCard },
  { key: "messages", label: "Messages", href: "/messages", icon: IconMessage },
];

function initialsFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  const chars = parts.length >= 2 ? [parts[0][0], parts[1][0]] : [local[0], local[1]];
  return chars.filter(Boolean).join("").toUpperCase() || "?";
}

function Sidebar({
  active,
  email,
  initials,
  onLogout,
}: {
  active: NavKey;
  email: string;
  initials: string;
  onLogout: () => void;
}) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-xs font-bold text-white">
          s
        </span>
        <span className="font-mono text-sm font-medium tracking-wide text-ink">shivecom</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === active;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-surface-2 text-ink" : "text-ink-2 hover:text-ink"
              }`}
            >
              <item.icon className={`h-4 w-4 ${isActive ? "text-accent" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 border-t border-border px-4 py-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 font-mono text-xs font-medium text-accent">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-ink-3">{email}</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-md p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          title="Sign out"
        >
          <IconLogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}

function Topbar({
  title,
  workspace,
  headerRight,
}: {
  title: string;
  workspace: string;
  headerRight?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-5 md:px-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-ink-3">{workspace}</p>
        <h1 className="text-xl font-semibold text-ink">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs text-ink-2">
          env: prod
        </span>
        {headerRight}
      </div>
    </header>
  );
}

function ShellLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  );
}

export function AppShell({
  active,
  title,
  headerRight,
  children,
}: {
  active: NavKey;
  title: string;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <ShellLoading />;
  }

  const workspace = user.organizations[0]?.org.name ?? "Workspace";
  const initials = initialsFromEmail(user.email);

  function handleLogout() {
    void logout().then(() => router.push("/logout"));
  }

  return (
    <div className="flex min-h-screen bg-bg text-ink">
      <Sidebar active={active} email={user.email} initials={initials} onLogout={handleLogout} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} workspace={workspace} headerRight={headerRight} />
        <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 px-6 py-8 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
