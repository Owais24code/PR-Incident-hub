import { ArrowRight, CheckCircle2, FileCheck2, GitBranch, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLockup } from "./BrandLockup";

const workflow = [
  { label: "Signal received", detail: "Slack or GitHub alert", icon: GitBranch },
  { label: "Context assembled", detail: "Repository, owner, and risk", icon: ShieldCheck },
  { label: "Action approved", detail: "Human review before execution", icon: CheckCircle2 },
  { label: "Work created", detail: "Jira ticket with an audit trail", icon: FileCheck2 }
];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <aside className="auth-story" aria-label="Product overview">
        <BrandLockup />
        <div className="auth-story-copy">
          <p className="public-kicker">Human-gated security operations</p>
          <h2>From security signal to accountable action.</h2>
          <p>
            Enrich alerts with code ownership, explain the risk in developer language, and create approved Jira work
            without losing the evidence chain.
          </p>
          <ol className="auth-workflow">
            {workflow.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.label}>
                  <span className="auth-step-index">0{index + 1}</span>
                  <span className="auth-step-icon"><Icon size={15} aria-hidden /></span>
                  <span>
                    <strong>{step.label}</strong>
                    <small>{step.detail}</small>
                  </span>
                </li>
              );
            })}
          </ol>
          <div className="auth-safety-note">
            <ShieldCheck size={16} aria-hidden />
            <span><strong>Approval required.</strong> The MVP never creates external work without a reviewer.</span>
          </div>
        </div>
        <Link className="auth-story-link" href="/">
          Explore the product <ArrowRight size={14} aria-hidden />
        </Link>
      </aside>

      <section className="auth-panel">
        <header className="auth-mobile-header"><BrandLockup compact /></header>
        <div className="auth-form-stage">{children}</div>
        <footer className="auth-footer">
          <span>Security PR Copilot</span>
          <span>Tenant-aware · Audit-first · Human-approved</span>
        </footer>
      </section>
    </main>
  );
}
