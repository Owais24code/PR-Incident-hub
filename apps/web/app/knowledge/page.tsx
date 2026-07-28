"use client";

import { BookOpen, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { api, getToken } from "@/lib/api";
import type { Incident } from "@/lib/types";

export default function KnowledgePage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    void api.incidents()
      .then(setIncidents)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load incident knowledge"))
      .finally(() => setLoading(false));
  }, []);

  const entries = useMemo(() => {
    const value = query.trim().toLowerCase();
    return incidents.filter((incident) => {
      if (!value) return true;
      return [incident.summary, incident.owner_suggestion, incident.severity, incident.status]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(value));
    });
  }, [incidents, query]);

  return (
    <div className="overview-page">
      <header className="overview-header">
        <div>
          <h1>Incident knowledge</h1>
          <p>Search prior findings, ownership decisions, and remediation context.</p>
        </div>
      </header>
      <label className="knowledge-search">
        <Search size={16} aria-hidden />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search incident memory..." />
      </label>
      {error ? <div className="error" role="alert">{error}</div> : null}
      <section className="knowledge-grid">
        {entries.map((incident) => (
          <Link href={`/incidents/${incident.id}`} className="knowledge-entry" key={incident.id}>
            <div className="knowledge-entry-icon"><BookOpen size={17} aria-hidden /></div>
            <div>
              <strong>{incident.summary || `Incident ${incident.id.slice(0, 8)}`}</strong>
              <p>{incident.owner_suggestion || "Owner not yet suggested"}</p>
            </div>
            <div className="knowledge-entry-status"><StatusBadge value={incident.severity} /><StatusBadge value={incident.status} /></div>
          </Link>
        ))}
        {!loading && !error && entries.length === 0 ? (
          <div className="overview-panel knowledge-empty"><ShieldCheck size={22} aria-hidden /><p>No matching incident knowledge.</p></div>
        ) : null}
      </section>
    </div>
  );
}
