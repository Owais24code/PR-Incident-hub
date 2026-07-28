"use client";

import {
  Activity,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Github,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TicketCheck,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { api, getToken } from "@/lib/api";
import type { AuditLog, Incident, Integration } from "@/lib/types";

const severityOrder = ["critical", "high", "medium", "low", "unknown"];

function relativeTime(value: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function integrationName(integration: Integration) {
  const config = integration.config_json;
  const candidate = config.name ?? config.repository ?? config.project_key ?? config.team_id ?? config.channel_id;
  return typeof candidate === "string" ? candidate : `${integration.type} workspace`;
}

function actionName(value: string) {
  return value.replace(/[._]/g, " ");
}

function IntegrationGlyph({ type }: { type: Integration["type"] }) {
  if (type === "slack") return <MessageSquare size={14} aria-hidden />;
  if (type === "github") return <Github size={14} aria-hidden />;
  if (type === "openai") return <Bot size={14} aria-hidden />;
  return <TicketCheck size={14} aria-hidden />;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [integrationNotice, setIntegrationNotice] = useState("");
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
      const [incidentResult, integrationResult, auditResult] = await Promise.allSettled([
        api.incidents(),
        api.integrations(),
        api.auditLogs()
      ]);
      if (incidentResult.status === "rejected") throw incidentResult.reason;
      setIncidents(incidentResult.value);
      setIntegrations(integrationResult.status === "fulfilled" ? integrationResult.value : []);
      setIntegrationNotice(
        integrationResult.status === "rejected" ? "Integration configuration is available to workspace administrators." : ""
      );
      setAuditLogs(auditResult.status === "fulfilled" ? auditResult.value : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load overview");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const metrics = useMemo(() => {
    const open = incidents.filter((incident) => incident.status !== "closed");
    const closed = incidents.filter((incident) => incident.status === "closed");
    const ticketed = incidents.filter((incident) => incident.status === "ticketed");
    const avgRisk = open.length
      ? Math.round(open.reduce((sum, incident) => sum + incident.risk_score, 0) / open.length)
      : 0;
    return {
      open,
      closed: closed.length,
      ticketed: ticketed.length,
      avgRisk,
      critical: open.filter((incident) => incident.severity === "critical").length
    };
  }, [incidents]);

  const severityCounts = useMemo(() => {
    return metrics.open.reduce<Record<string, number>>((counts, incident) => {
      counts[incident.severity] = (counts[incident.severity] ?? 0) + 1;
      return counts;
    }, {});
  }, [metrics.open]);

  const volume = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      return {
        label: date.toLocaleDateString(undefined, { weekday: "short" }),
        count: incidents.filter((incident) => {
          const created = new Date(incident.created_at);
          return created >= date && created < next;
        }).length
      };
    });
  }, [incidents]);

  const maxVolume = Math.max(1, ...volume.map((day) => day.count));
  const attention = [...metrics.open]
    .sort((a, b) => b.risk_score - a.risk_score || new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(0, 5);
  const recentAudit = auditLogs.slice(0, 6);
  const visibleIntegrations = Array.from(
    new Map(integrations.map((integration) => [`${integration.type}:${integrationName(integration)}`, integration])).values()
  ).slice(0, 6);
  const openLabel = metrics.open.length === 1 ? "incident needs" : "incidents need";

  return (
    <div className="overview-page">
      <header className="overview-header">
        <div>
          <h1>Overview</h1>
          <p>{loading ? "Loading triage state and workflow activity..." : `Turn security alerts into developer-ready fixes. ${metrics.open.length} open ${openLabel} attention.`}</p>
        </div>
        <div className="overview-actions">
          <button className="icon-button" onClick={() => void load()} title="Refresh overview" aria-label="Refresh overview">
            <RefreshCw size={16} aria-hidden />
          </button>
          <Link className="primary-action" href="/incidents">
            View incidents <ArrowUpRight size={15} aria-hidden />
          </Link>
        </div>
      </header>

      {error ? (
        <div className="error error-banner" role="alert">
          <span><strong>Workspace data is unavailable.</strong> {error}</span>
          <button onClick={() => void load()}>Retry</button>
        </div>
      ) : null}
      {loading ? <div className="loading-line" role="status" aria-live="polite"><span /> Loading workspace signals</div> : null}

      {!loading ? <>
      <section className="overview-metrics" aria-label="Incident metrics">
        <article className="overview-metric critical-metric">
          <div><span>Open incidents</span><ShieldAlert size={15} aria-hidden /></div>
          <strong>{metrics.open.length}</strong>
          <small>{metrics.critical} critical</small>
        </article>
        <article className="overview-metric resolved-metric">
          <div><span>Closed incidents</span><CheckCircle2 size={15} aria-hidden /></div>
          <strong>{metrics.closed}</strong>
          <small>currently in closed stage</small>
        </article>
        <article className="overview-metric risk-metric">
          <div><span>Avg. risk score</span><Activity size={15} aria-hidden /></div>
          <strong>{metrics.avgRisk}<em>/100</em></strong>
          <small>across open</small>
        </article>
        <article className="overview-metric ticket-metric">
          <div><span>Ticketed incidents</span><TicketCheck size={15} aria-hidden /></div>
          <strong>{metrics.ticketed}</strong>
          <small>approved Jira work</small>
        </article>
      </section>

      <section className="overview-grid overview-grid-top">
        <article className="overview-panel volume-panel">
          <div className="panel-heading">
            <div><h2>Incident volume</h2><p>Last 7 days</p></div>
            <Activity size={15} aria-hidden />
          </div>
          <div
            className="volume-chart"
            role="img"
            aria-label={`Incident volume for the last seven days: ${volume.map((day) => `${day.label} ${day.count}`).join(", ")}`}
          >
            {volume.map((day) => (
              <div className="volume-day" key={day.label}>
                <span className="volume-value">{day.count || ""}</span>
                <div className="volume-track" aria-hidden="true"><i style={{ height: day.count ? `${Math.max(4, (day.count / maxVolume) * 100)}%` : "0" }} /></div>
                <small>{day.label}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="overview-panel severity-panel">
          <div className="panel-heading"><div><h2>Open by severity</h2><p>{metrics.open.length} open</p></div></div>
          <div className="severity-list">
            {severityOrder.filter((severity) => severity !== "unknown" || (severityCounts.unknown ?? 0) > 0).map((severity) => {
              const count = severityCounts[severity] ?? 0;
              const width = count && metrics.open.length ? Math.max(4, Math.round((count / metrics.open.length) * 100)) : 0;
              return (
                <div className={`severity-row severity-${severity}`} key={severity}>
                  <div><span>{severity}</span><strong>{count}</strong></div>
                  <div className="severity-track"><i style={{ width: `${width}%` }} /></div>
                </div>
              );
            })}
          </div>
          <div className="insight-note"><Zap size={13} aria-hidden /> Owner and severity suggestions are generated during analysis.</div>
        </article>
      </section>

      <section className="overview-grid overview-grid-middle">
        <article className="overview-panel recent-panel">
          <div className="panel-heading">
            <div><h2>Needs attention</h2><p>Open work ranked by risk and age</p></div>
            <Link href="/incidents">All <ArrowUpRight size={12} aria-hidden /></Link>
          </div>
          <div className="incident-feed">
            {attention.map((incident) => (
              <Link className="incident-feed-row" href={`/incidents/${incident.id}`} key={incident.id}>
                <StatusBadge value={incident.severity} />
                <div className="incident-feed-copy">
                  <strong>{incident.summary || `Incident ${incident.id.slice(0, 8)}`}</strong>
                  <span>{incident.owner_suggestion || "Unassigned"} · {relativeTime(incident.updated_at)}</span>
                </div>
                <div className="risk-meter" aria-hidden="true"><i style={{ width: `${incident.risk_score}%` }} /></div>
                <b>{incident.risk_score}</b>
                <StatusBadge value={incident.status} />
              </Link>
            ))}
            {!loading && attention.length === 0 ? <p className="empty-state">No open incidents need action.</p> : null}
          </div>
        </article>

        <article className="overview-panel audit-panel">
          <div className="panel-heading"><div><h2>Audit trail</h2><p>Latest system actions</p></div></div>
          <div className="audit-feed">
            {recentAudit.map((log) => (
              <div className="audit-feed-row" key={log.id}>
                <span />
                <div><strong>{log.actor_user_id ? "user" : "system"} · {actionName(log.action)}</strong><small>{relativeTime(log.created_at)}</small></div>
              </div>
            ))}
            {!loading && recentAudit.length === 0 ? <p className="empty-state">Audit events will appear here.</p> : null}
          </div>
        </article>
      </section>

      <section className="overview-panel integrations-panel">
        <div className="panel-heading">
          <div><h2>Integrations</h2><p>Configured sources and destinations</p></div>
          <Link href="/integrations">Manage <ArrowUpRight size={12} aria-hidden /></Link>
        </div>
        <div className="integration-overview-grid">
          {visibleIntegrations.map((integration) => (
            <Link href="/integrations" className="integration-overview-item" key={integration.id}>
              <span className="integration-icon"><IntegrationGlyph type={integration.type} /></span>
              <div><strong>{integrationName(integration)}</strong><small>{integration.type}</small></div>
              <i className={integration.status === "configured" ? "connected" : "pending"} />
            </Link>
          ))}
          {!loading && visibleIntegrations.length === 0 ? (
            <Link href="/integrations" className="integration-overview-item empty-integration">
              <span className="integration-icon"><Sparkles size={14} aria-hidden /></span>
              <div><strong>Connect your first source</strong><small>Slack, GitHub, Jira, or OpenAI</small></div>
            </Link>
          ) : null}
        </div>
        {integrationNotice ? <p className="integration-notice">{integrationNotice}</p> : null}
      </section>
      </> : null}
    </div>
  );
}
