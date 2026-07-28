"use client";

import {
  Bell,
  BookOpen,
  FileSearch,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { api, clearToken, getToken } from "@/lib/api";
import type { User } from "@/lib/types";

const nav = [
  { href: "/analytics", label: "Overview", icon: LayoutDashboard },
  { href: "/incidents", label: "Incidents", icon: ShieldAlert },
  { href: "/integrations", label: "Integrations", icon: KeyRound },
  { href: "/audit-log", label: "Audit Log", icon: FileSearch },
  { href: "/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [connected, setConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const isPublic = pathname === "/" || pathname === "/login" || pathname === "/signup";

  useEffect(() => {
    const hasToken = Boolean(getToken());
    setAuthenticated(hasToken);
    if (!isPublic && hasToken) {
      void api.me()
        .then((currentUser) => {
          setUser(currentUser);
          setConnected(true);
        })
        .catch(() => {
          setUser(null);
          setConnected(false);
        });
    }
  }, [isPublic, pathname]);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInput.current?.focus();
      }
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  function search(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/incidents?q=${encodeURIComponent(value)}` : "/incidents");
  }

  function signOut() {
    clearToken();
    setAuthenticated(false);
    setConnected(false);
    router.push("/login");
  }

  if (isPublic) return <>{children}</>;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className="sidebar">
        <Link href="/analytics" className="brand">
          <span className="brand-mark"><ShieldCheck size={17} aria-hidden /></span>
          <span>
            Security PR Copilot
            <small>Security operations</small>
          </span>
        </Link>
        <nav className="nav">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`nav-link ${active ? "active" : ""}`}
                href={item.href}
                key={item.href}
              >
                <Icon size={18} aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        {authenticated ? (
          <button className="sidebar-signout" onClick={signOut} title="Sign out">
            <LogOut size={17} aria-hidden />
            <span>Sign Out</span>
          </button>
        ) : null}
      </aside>
      <section className="shell-content">
        <header className="topbar">
          <form className="global-search" onSubmit={search} role="search">
            <Search size={15} aria-hidden />
            <input
              aria-label="Search incidents"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search incident summaries and alert titles"
              ref={searchInput}
              value={query}
            />
            <kbd>Ctrl K</kbd>
          </form>
          <div className="topbar-actions">
            <span className={`live-indicator ${connected ? "connected" : "disconnected"}`}>
              <i /> {connected ? "Workspace connected" : "Checking connection"}
            </span>
            <Link className="icon-button" href="/audit-log" title="View audit activity" aria-label="View audit activity">
              <Bell size={16} aria-hidden />
            </Link>
            <div className="user-chip" title={user?.email ?? "Signed in user"}>
              {(user?.name || user?.email || "SC").slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="main" id="main-content">{children}</main>
      </section>
    </div>
  );
}
