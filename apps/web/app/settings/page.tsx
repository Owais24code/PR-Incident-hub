"use client";

import { Check, KeyRound, Shield, Workflow } from "lucide-react";

const controls = [
  {
    title: "Human Approval Gate",
    icon: Shield,
    body: "Jira ticket creation is blocked until an analyzed incident is explicitly approved."
  },
  {
    title: "OpenAI Required",
    icon: KeyRound,
    body: "Incident analysis calls the configured OpenAI model and fails closed when the key is absent."
  },
  {
    title: "Workflow States",
    icon: Workflow,
    body: "Incidents move through received, enriched, summarized, approved, ticketed, and closed."
  }
];

export default function SettingsPage() {
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Operational defaults</p>
          <h1>Settings</h1>
          <p className="muted">MVP guardrails and deployment expectations for the current tenant.</p>
        </div>
      </header>

      <section className="grid two">
        {controls.map((item) => {
          const Icon = item.icon;
          return (
            <article className="card" key={item.title}>
              <h2>
                <Icon size={20} aria-hidden /> {item.title}
              </h2>
              <p className="muted">{item.body}</p>
              <p>
                <span className="badge good">
                  <Check size={13} aria-hidden /> Enabled
                </span>
              </p>
            </article>
          );
        })}
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2>Environment Checklist</h2>
        <div className="table-scroll" role="region" aria-label="Environment checklist" tabIndex={0}>
        <table className="table">
          <thead>
            <tr>
              <th>Variable</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>OPENAI_API_KEY</td>
              <td>Required for incident summaries and recommendations.</td>
            </tr>
            <tr>
              <td>SLACK_SIGNING_SECRET</td>
              <td>Verifies Slack webhook authenticity.</td>
            </tr>
            <tr>
              <td>GITHUB_WEBHOOK_SECRET</td>
              <td>Verifies GitHub webhook authenticity.</td>
            </tr>
            <tr>
              <td>JIRA_API_TOKEN</td>
              <td>Allows approved incidents to create Jira work.</td>
            </tr>
          </tbody>
        </table>
        </div>
      </section>
    </>
  );
}
