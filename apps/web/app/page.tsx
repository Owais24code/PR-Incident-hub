import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  FileCheck2,
  Github,
  GitPullRequest,
  KeyRound,
  LockKeyhole,
  MessageSquare,
  Route,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  TicketCheck
} from "lucide-react";
import { BrandLockup } from "@/components/BrandLockup";

export const metadata: Metadata = {
  title: "Security PR Copilot | Alerts to developer-ready fixes",
  description: "Enrich security alerts, route them to the right owner, and create approval-gated Jira work."
};

const workflow = [
  { number: "01", title: "Ingest", body: "Receive signed Slack and GitHub events without replacing your existing tools.", icon: MessageSquare },
  { number: "02", title: "Enrich", body: "Attach repository, commit, ownership, and nearby incident context.", icon: SearchCheck },
  { number: "03", title: "Explain", body: "Generate a concise narrative, risk rationale, likely owner, and fix path.", icon: Sparkles },
  { number: "04", title: "Approve", body: "A reviewer decides when the incident is ready to become Jira work.", icon: FileCheck2 }
];

const features = [
  {
    title: "Developer-grade incident briefs",
    body: "Translate scanner language into the affected service, likely exploit path, blast radius, and practical next step.",
    icon: Bot,
    proof: ["Severity rationale", "Owner confidence", "Recommended fix path"]
  },
  {
    title: "Routing grounded in code context",
    body: "Use repository metadata and ownership signals to put each alert in front of the team that can resolve it.",
    icon: Route,
    proof: ["Repository context", "Likely owner", "Evidence snapshots"]
  },
  {
    title: "Actions remain human-controlled",
    body: "Analysis can move quickly while ticket creation stays behind explicit approval and policy checks.",
    icon: LockKeyhole,
    proof: ["Approval gate", "Policy check", "Audited action"]
  }
];

const integrations = [
  { name: "Slack", detail: "Alert intake", icon: MessageSquare },
  { name: "GitHub", detail: "Code context", icon: Github },
  { name: "Jira", detail: "Approved work", icon: TicketCheck },
  { name: "OpenAI", detail: "Incident analysis", icon: Sparkles }
];

export default function MarketingPage() {
  return (
    <main className="public-page">
      <header className="public-header">
        <div className="public-container public-header-inner">
          <BrandLockup />
          <nav className="public-nav" aria-label="Primary navigation">
            <a href="#workflow">Workflow</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#integrations">Integrations</a>
            <a href="#security">Security</a>
          </nav>
          <div className="public-header-actions">
            <Link className="public-text-link" href="/login">Sign in</Link>
            <Link className="public-button primary" href="/signup">
              Create workspace <ArrowRight size={15} aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      <section className="public-hero">
        <div className="public-container">
          <div className="public-hero-copy">
            <p className="public-kicker"><span /> Security response for engineering teams</p>
            <h1>Security PR Copilot</h1>
            <p className="public-hero-statement">Turn alert noise into developer-ready fixes.</p>
            <p className="public-hero-lede">
              Enrich security alerts with code and ownership context, explain what matters, and create Jira work only
              after a human approves the action.
            </p>
            <div className="public-hero-actions">
              <Link className="public-button primary" href="/signup">
                Start with a workspace <ArrowRight size={16} aria-hidden />
              </Link>
              <Link className="public-button secondary" href="/login">Open the console</Link>
            </div>
            <div className="public-trust-row" aria-label="Product safeguards">
              <span><CheckCircle2 size={14} aria-hidden /> Human approval</span>
              <span><KeyRound size={14} aria-hidden /> Tenant-aware access</span>
              <span><ShieldCheck size={14} aria-hidden /> Full audit trail</span>
            </div>
          </div>

          <figure className="public-product-frame">
            <div className="public-window-bar">
              <span className="public-window-dots" aria-hidden><i /><i /><i /></span>
              <span>security-pr-copilot / overview</span>
              <strong><span /> Workspace connected</strong>
            </div>
            <Image
              alt="Security PR Copilot overview showing incident risk, severity, ownership, and audit activity"
              className="public-product-image"
              height={760}
              priority
              src="/security-console-preview.png"
              width={1400}
            />
            <figcaption>Live product view using local demo incident data.</figcaption>
          </figure>
        </div>
      </section>

      <section className="public-proof-band" aria-label="Core outcome">
        <div className="public-container">
          <span>One alert</span><ArrowRight size={14} aria-hidden />
          <span>One accountable owner</span><ArrowRight size={14} aria-hidden />
          <span>One approved action trail</span>
        </div>
      </section>

      <section className="public-section" id="workflow">
        <div className="public-container">
          <SectionHeader eyebrow="Workflow" title="From noisy signal to accountable work" body="A narrow response loop that fits the tools your engineering and security teams already use." />
          <div className="public-workflow-grid">
            {workflow.map((step) => {
              const Icon = step.icon;
              return (
                <article key={step.number}>
                  <div><span>{step.number}</span><Icon size={17} aria-hidden /></div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="public-section public-section-muted" id="capabilities">
        <div className="public-container">
          <SectionHeader eyebrow="Why it matters" title="Security context developers can act on" body="Less time rebuilding context. More time deciding, assigning, and fixing." />
          <div className="public-feature-grid">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article className="public-feature" key={feature.title}>
                  <span className="public-feature-icon"><Icon size={18} aria-hidden /></span>
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                  <ul>{feature.proof.map((item) => <li key={item}><Check size={13} aria-hidden />{item}</li>)}</ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="public-section" id="integrations">
        <div className="public-container public-integration-layout">
          <SectionHeader align="left" eyebrow="Connected workflow" title="Keep the stack. Improve the handoff." body="Use Slack and GitHub as signal sources, OpenAI for structured analysis, and Jira as the approved destination." />
          <div className="public-integration-grid">
            {integrations.map((integration) => {
              const Icon = integration.icon;
              return <article key={integration.name}><Icon size={18} aria-hidden /><span><strong>{integration.name}</strong><small>{integration.detail}</small></span></article>;
            })}
          </div>
        </div>
      </section>

      <section className="public-security-band" id="security">
        <div className="public-container public-security-layout">
          <div>
            <p className="public-kicker">Designed for controlled action</p>
            <h2>AI proposes. Your team decides.</h2>
            <p>Every sensitive transition is explicit, tenant-scoped, and recorded so reviewers can reconstruct what happened.</p>
          </div>
          <ul>
            <li><LockKeyhole size={17} aria-hidden /><span><strong>Approval gates</strong><small>Ticket creation is blocked until review.</small></span></li>
            <li><ShieldCheck size={17} aria-hidden /><span><strong>Signed webhooks</strong><small>Slack and GitHub events are verified.</small></span></li>
            <li><GitPullRequest size={17} aria-hidden /><span><strong>No autonomous merge</strong><small>Remediation stays human-controlled.</small></span></li>
          </ul>
        </div>
      </section>

      <section className="public-final-cta">
        <div className="public-container">
          <div><p className="public-kicker">Start with one alert source</p><h2>Make the next security alert easier to own.</h2></div>
          <div><Link className="public-button primary" href="/signup">Create workspace <ArrowRight size={15} aria-hidden /></Link><Link className="public-button secondary" href="/login">Sign in</Link></div>
        </div>
      </section>

      <footer className="public-footer"><div className="public-container"><BrandLockup compact /><span>Developer-ready security response.</span><span>Built around human approval and auditability.</span></div></footer>
    </main>
  );
}

function SectionHeader({ eyebrow, title, body, align = "center" }: { eyebrow: string; title: string; body: string; align?: "center" | "left" }) {
  return <div className={`public-section-header ${align === "left" ? "left" : ""}`}><p className="public-kicker">{eyebrow}</p><h2>{title}</h2><p>{body}</p></div>;
}
