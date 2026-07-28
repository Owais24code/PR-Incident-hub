"use client";

import { Activity, AlertTriangle, BarChart3, CheckCircle2, GitBranch, RefreshCw, ShieldAlert, TicketCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { api, getToken } from "@/lib/api";
import type { AuditLog, Incident, Integration } from "@/lib/types";

function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [incidentData, integrationData, auditData] = await Promise.all([
        api.incidents(),
        api.integrations(),
        api.auditLogs()
      ]);
      setIncidents(incidentData);
      setIntegrations(integrationData);
      setAuditLogs(auditData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const metrics = useMemo(() => {
    const total = incidents.length;
    const highRisk = incidents.filter((incident) => incident.severity === "high" || incident.severity === "critical").length;
    const approved = incidents.filter((incident) => incident.status === "approved" || incident.status === "ticketed").length;
    const ticketed = incidents.filter((incident) => incident.status === "ticketed").length;
    const avgRisk = total
      ? Math.round(incidents.reduce((sum, incident) => sum + incident.risk_score, 0) / total)
      : 0;
    const ownerCoverage = incidents.filter((incident) => Boolean(incident.owner_suggestion)).length;
    const configuredIntegrations = integrations.filter((integration) => integration.status === "configured").length;

    return {
      total,
      highRisk,
      approved,
      ticketed,
      avgRisk,
      ownerCoverage,
      configuredIntegrations
    };
  }, [incidents, integrations]);

  const statusCounts = useMemo(() => {
    return incidents.reduce<Record<string, number>>((counts, incident) => {
      counts[incident.status] = (counts[incident.status] ?? 0) + 1;
      return counts;
    }, {});
  }, [incidents]);

  const severityCounts = useMemo(() => {
    return incidents.reduce<Record<string, number>>((counts, incident) => {
      counts[incident.severity] = (counts[incident.severity] ?? 0) + 1;
      return counts;
    }, {});
  }, [incidents]);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Security operations analytics</p>
          <h1>Response health and risk routing</h1>
          <p className="muted">Track how alerts move from signal to approved developer work.</p>
        </div>
        <button className="icon-text-button" onClick={() => void load()} title="Refresh analytics">
          <RefreshCw size={17} aria-hidden />
          <span>Refresh</span>
        </button>
      </header>

      {error ? <div className="error">{error}</div> : null}
      {loading ? <p className="muted">Loading analytics...</p> : null}

      <section className="metric-grid">
        <article className="metric-card">
          <Activity size={20} aria-hidden />
          <span>Total Incidents</span>
          <strong>{metrics.total}</strong>
        </article>
        <article className="metric-card">
          <AlertTriangle size={20} aria-hidden />
          <span>High Risk</span>
          <strong>{metrics.highRisk}</strong>
        </article>
        <article className="metric-card">
          <BarChart3 size={20} aria-hidden />
          <span>Average Risk</span>
          <strong>{metrics.avgRisk}</strong>
        </article>
        <article className="metric-card">
          <TicketCheck size={20} aria-hidden />
          <span>Ticketed</span>
          <strong>{metrics.ticketed}</strong>
        </article>
      </section>

      <section className="grid two analytics-grid">
        <article className="card">
          <h2>
            <ShieldAlert size={20} aria-hidden /> Incident Pipeline
          </h2>
          <div className="progress-list">
            {["received", "enriched", "summarized", "approved", "ticketed", "closed"].map((status) => (
              <div className="progress-row" key={status}>
                <span>
                  <StatusBadge value={status} />
                </span>
                <div className="progress-track">
                  <div style={{ width: `${percent(statusCounts[status] ?? 0, metrics.total)}%` }} />
                </div>
                <strong>{statusCounts[status] ?? 0}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <h2>
            <AlertTriangle size={20} aria-hidden /> Severity Mix
          </h2>
          <div className="progress-list">
            {["critical", "high", "medium", "low", "unknown"].map((severity) => (
              <div className="progress-row" key={severity}>
                <span>
                  <StatusBadge value={severity} />
                </span>
                <div className="progress-track">
                  <div style={{ width: `${percent(severityCounts[severity] ?? 0, metrics.total)}%` }} />
                </div>
                <strong>{severityCounts[severity] ?? 0}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid two analytics-grid">
        <article className="card">
          <h2>
            <CheckCircle2 size={20} aria-hidden /> Action Readiness
          </h2>
          <div className="readiness-score">
            <strong>{percent(metrics.approved, metrics.total)}%</strong>
            <span>approved or ticketed</span>
          </div>
          <p className="muted">
            {metrics.ownerCoverage} incidents have owner suggestions. {metrics.configuredIntegrations} integrations are
            configured for routing and context.
          </p>
        </article>

        <article className="card">
          <h2>
            <GitBranch size={20} aria-hidden /> Audit Activity
          </h2>
          <div className="readiness-score">
            <strong>{auditLogs.length}</strong>
            <span>recent audit events</span>
          </div>
          <p className="muted">AI summaries, approvals, integration changes, and ticket actions are visible here.</p>
        </article>
      </section>
    </>
  );
}
