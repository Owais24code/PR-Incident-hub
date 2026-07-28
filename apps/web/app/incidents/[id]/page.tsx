"use client";

import { CheckCircle2, RefreshCw, Send, Sparkles } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { api, getToken } from "@/lib/api";
import type { IncidentDetail } from "@/lib/types";

export default function IncidentDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  async function load() {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      setIncident(await api.incident(params.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load incident");
    } finally {
      setLoading(false);
    }
  }

  async function runAction(action: "analyze" | "approve" | "ticket") {
    if (!incident) return;
    setActing(true);
    setError("");
    setNotice("");
    try {
      if (action === "analyze") {
        const job = await api.analyzeIncident(incident.id);
        setNotice(`Analysis queued as job ${job.job_id}. Refresh when the worker finishes.`);
      }
      if (action === "approve") {
        setIncident(await api.approveIncident(incident.id));
        setNotice("Incident approved for ticket creation.");
      }
      if (action === "ticket") {
        const job = await api.createTicket(incident.id);
        setNotice(`Jira ticket creation queued as job ${job.job_id}.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActing(false);
    }
  }

  useEffect(() => {
    void load();
  }, [params.id]);

  const latestRecommendation = incident?.recommendations.at(-1);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Incident detail</p>
          <h1>{incident?.alert.title || "Incident"}</h1>
          {incident ? (
            <p className="muted">
              {incident.alert.source_type} alert {incident.alert.source_event_id}
            </p>
          ) : null}
        </div>
        <div className="actions">
          <button className="icon-text-button secondary" onClick={() => void load()} title="Refresh incident">
            <RefreshCw size={17} aria-hidden />
            <span>Refresh</span>
          </button>
          <button
            className="icon-text-button"
            disabled={acting || !incident}
            onClick={() => void runAction("analyze")}
            title="Analyze incident"
          >
            <Sparkles size={17} aria-hidden />
            <span>Analyze</span>
          </button>
          <button
            className="icon-text-button"
            disabled={acting || !incident || !incident.summary}
            onClick={() => void runAction("approve")}
            title="Approve incident"
          >
            <CheckCircle2 size={17} aria-hidden />
            <span>Approve</span>
          </button>
          <button
            className="icon-text-button"
            disabled={acting || !incident || incident.status !== "approved"}
            onClick={() => void runAction("ticket")}
            title="Create Jira ticket"
          >
            <Send size={17} aria-hidden />
            <span>Create Ticket</span>
          </button>
        </div>
      </header>

      {error ? <div className="error">{error}</div> : null}
      {notice ? <div className="card">{notice}</div> : null}
      {loading ? <p className="muted">Loading incident...</p> : null}

      {incident ? (
        <div className="grid">
          <section className="card">
            <div className="toolbar">
              <StatusBadge value={incident.status} />
              <StatusBadge value={incident.severity} />
              <span className="badge neutral">Risk {incident.risk_score}</span>
              <span className="badge neutral">Owner {incident.owner_suggestion || "unknown"}</span>
            </div>
            <h2>Summary</h2>
            <p>{incident.summary || "No analysis has been generated yet."}</p>
          </section>

          <section className="grid two">
            <div className="card">
              <h2>Recommendation</h2>
              <p>{latestRecommendation?.recommendation_text || "No recommendation yet."}</p>
              {latestRecommendation ? (
                <p className="muted">
                  Confidence {(latestRecommendation.confidence * 100).toFixed(0)}%.{" "}
                  {latestRecommendation.severity_rationale}
                </p>
              ) : null}
            </div>

            <div className="card">
              <h2>Tickets</h2>
              {incident.tickets.length ? (
                incident.tickets.map((ticket) => (
                  <p key={ticket.id}>
                    <StatusBadge value={ticket.status} />{" "}
                    {ticket.external_url ? (
                      <a className="link-button" href={ticket.external_url} target="_blank" rel="noreferrer">
                        {ticket.external_ticket_id}
                      </a>
                    ) : (
                      ticket.external_ticket_id
                    )}
                  </p>
                ))
              ) : (
                <p className="muted">No tickets created yet.</p>
              )}
            </div>
          </section>

          <section className="card">
            <h2>Evidence</h2>
            {incident.evidence.length ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Source</th>
                    <th>Reference</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {incident.evidence.map((evidence) => (
                    <tr key={evidence.id}>
                      <td>{evidence.evidence_type}</td>
                      <td>{evidence.source}</td>
                      <td>{evidence.reference_id || "n/a"}</td>
                      <td>{new Date(evidence.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="muted">No enrichment evidence stored yet.</p>
            )}
          </section>

          <section className="card">
            <h2>Raw Alert</h2>
            <pre className="json-block">{JSON.stringify(incident.alert.raw_payload_json, null, 2)}</pre>
          </section>
        </div>
      ) : null}
    </>
  );
}

