"use client";

import { RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { api, getToken } from "@/lib/api";
import type { Incident } from "@/lib/types";

export default function IncidentsPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(queryOverride?: string) {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      const activeQuery = queryOverride ?? q;
      if (activeQuery) params.set("q", activeQuery);
      if (status) params.set("status", status);
      if (severity) params.set("severity", severity);
      const suffix = params.size ? `?${params.toString()}` : "";
      setIncidents(await api.incidents(suffix));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load incidents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initialQuery = new URLSearchParams(window.location.search).get("q") ?? "";
    setQ(initialQuery);
    void load(initialQuery);
  }, []);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Incident queue</p>
          <h1>Developer-ready security work</h1>
          <p className="muted">Review incoming alerts, generated summaries, recommended owners, and approval state.</p>
        </div>
        <button className="icon-text-button" onClick={() => void load()} title="Refresh incidents">
          <RefreshCw size={17} aria-hidden />
          <span>Refresh</span>
        </button>
      </header>

      <section className="toolbar">
        <input className="input" placeholder="Search incidents" value={q} onChange={(event) => setQ(event.target.value)} />
        <select className="select" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="received">Received</option>
          <option value="enriched">Enriched</option>
          <option value="summarized">Summarized</option>
          <option value="approved">Approved</option>
          <option value="ticketed">Ticketed</option>
          <option value="closed">Closed</option>
        </select>
        <select className="select" value={severity} onChange={(event) => setSeverity(event.target.value)}>
          <option value="">All severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
          <option value="unknown">Unknown</option>
        </select>
        <button className="icon-text-button" onClick={() => void load()} title="Apply filters">
          <Search size={17} aria-hidden />
          <span>Filter</span>
        </button>
      </section>

      {error ? <div className="error">{error}</div> : null}
      {loading ? <p className="muted">Loading incidents...</p> : null}

      <div className="table-scroll" role="region" aria-label="Incident results" tabIndex={0}>
      <table className="table">
        <thead>
          <tr>
            <th>Incident</th>
            <th>Status</th>
            <th>Severity</th>
            <th>Risk</th>
            <th>Owner</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => (
            <tr key={incident.id}>
              <td>
                <Link className="link-button" href={`/incidents/${incident.id}`}>
                  {incident.summary?.slice(0, 78) || incident.id}
                </Link>
              </td>
              <td>
                <StatusBadge value={incident.status} />
              </td>
              <td>
                <StatusBadge value={incident.severity} />
              </td>
              <td>{incident.risk_score}</td>
              <td>{incident.owner_suggestion || "Unassigned"}</td>
              <td>{new Date(incident.updated_at).toLocaleString()}</td>
            </tr>
          ))}
          {!loading && incidents.length === 0 ? (
            <tr>
              <td colSpan={6} className="muted">
                No incidents match the current filters.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
      </div>
    </>
  );
}
