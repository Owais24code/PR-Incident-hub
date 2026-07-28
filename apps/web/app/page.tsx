import { ArrowRight, BarChart3, Bot, CheckCircle2, FileText, GitPullRequest, LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";

const outcomes = [
  "Convert noisy Slack and GitHub alerts into developer-ready work.",
  "Keep approvals, Jira tickets, and AI recommendations in one audit trail.",
  "Show security leaders where risk, owner load, and response states are trending."
];

const features = [
  {
    title: "AI Incident Translation",
    body: "Security alerts become plain-language summaries with severity rationale, likely owner, and next-step guidance.",
    icon: Bot
  },
  {
    title: "Human-Gated Actions",
    body: "Jira ticket creation and future remediation paths stay blocked until a reviewer approves the incident.",
    icon: LockKeyhole
  },
  {
    title: "DevSecOps Analytics",
    body: "Track risk score, ticket readiness, owner routing, integration health, and audit volume from the console.",
    icon: BarChart3
  }
];

export default function MarketingPage() {
  return (
    <main className="marketing-page">
      <nav className="marketing-nav" aria-label="Marketing navigation">
        <Link href="/" className="brand">
          <ShieldCheck size={24} aria-hidden />
          <span>Security PR Copilot</span>
        </Link>
        <div className="actions">
          <Link className="link-button" href="/login">
            Login
          </Link>
          <Link className="icon-text-button" href="/signup">
            <span>Start Free</span>
            <ArrowRight size={17} aria-hidden />
          </Link>
        </div>
      </nav>

      <section className="marketing-hero">
        <div>
          <p className="eyebrow">AI security ops for engineering teams</p>
          <h1>Turn security alerts into developer-ready fixes.</h1>
          <p className="hero-copy">
            Security PR Copilot helps B2B SaaS teams triage alerts, enrich them with code and ticket context, and move
            from risk signal to approved Jira work without losing auditability.
          </p>
          <div className="actions">
            <Link className="icon-text-button" href="/signup">
              <span>Create Workspace</span>
              <ArrowRight size={17} aria-hidden />
            </Link>
            <Link className="link-button" href="/login">
              Open Console
            </Link>
          </div>
          <div className="hero-proof">
            {outcomes.map((item) => (
              <p key={item}>
                <CheckCircle2 size={16} aria-hidden /> {item}
              </p>
            ))}
          </div>
        </div>

        <div className="console-preview" aria-label="Product console preview">
          <div className="terminal-bar">
            <span />
            <span />
            <span />
            <strong>incident.runbook</strong>
          </div>
          <div className="terminal-lines">
            <p>
              <span>signal</span> github_dependabot.high
            </p>
            <p>
              <span>repo</span> acme/api - auth middleware
            </p>
            <p>
              <span>owner</span> api-platform
            </p>
            <p>
              <span>risk</span> 82 / high - approval required
            </p>
            <p>
              <span>next</span> create Jira task with fix path
            </p>
          </div>
        </div>
      </section>

      <section className="marketing-section">
        <p className="eyebrow">Why it matters</p>
        <h2>Security context finally lands where developers can act.</h2>
        <div className="feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article className="card" key={feature.title}>
                <h3>
                  <Icon size={19} aria-hidden /> {feature.title}
                </h3>
                <p className="muted">{feature.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="marketing-section">
        <div className="workflow-strip">
          <span>
            <FileText size={16} aria-hidden /> Alert
          </span>
          <span>
            <Bot size={16} aria-hidden /> AI Summary
          </span>
          <span>
            <GitPullRequest size={16} aria-hidden /> Fix Path
          </span>
          <span>
            <ShieldCheck size={16} aria-hidden /> Approval
          </span>
        </div>
      </section>
    </main>
  );
}
