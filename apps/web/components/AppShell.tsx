"use client";

import { Activity, FileSearch, KeyRound, LogOut, Settings, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken, getToken } from "@/lib/api";

const nav = [
  { href: "/incidents", label: "Incidents", icon: ShieldAlert },
  { href: "/integrations", label: "Integrations", icon: KeyRound },
  { href: "/audit-log", label: "Audit Log", icon: FileSearch },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/login";

  function signOut() {
    clearToken();
    router.push("/login");
  }

  if (isLogin) return <>{children}</>;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/incidents" className="brand">
          <Activity size={24} aria-hidden />
          <span>Security PR Copilot</span>
        </Link>
        <nav className="nav">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link className={`nav-link ${active ? "active" : ""}`} href={item.href} key={item.href}>
                <Icon size={18} aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        {getToken() ? (
          <button className="icon-text-button secondary" onClick={signOut} title="Sign out">
            <LogOut size={17} aria-hidden />
            <span>Sign Out</span>
          </button>
        ) : null}
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

