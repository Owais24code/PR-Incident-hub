"use client";

import {
  AlertCircle,
  Bot,
  Check,
  Github,
  Loader2,
  MessageSquare,
  Plus,
  Power,
  RefreshCw,
  Settings2,
  TicketCheck,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api, getToken } from "@/lib/api";
import type { Integration } from "@/lib/types";

type IntegrationType = Integration["type"];
type ConfigValue = unknown;

type ProviderField = {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
  help: string;
};

type ProviderDefinition = {
  label: string;
  description: string;
  icon: typeof MessageSquare;
  fields: ProviderField[];
  defaults: Record<string, ConfigValue>;
};

const providers: Record<IntegrationType, ProviderDefinition> = {
  slack: {
    label: "Slack",
    description: "Receive security alerts from a Slack workspace and route triage updates.",
    icon: MessageSquare,
    defaults: { display_name: "", team_id: "", channel_id: "" },
    fields: [
      { key: "display_name", label: "Connection name", placeholder: "SecOps alerts channel", required: true, help: "A recognizable name for your team." },
      { key: "team_id", label: "Workspace ID", placeholder: "T012ABC34", required: true, help: "The Slack workspace ID attached to incoming events." },
      { key: "channel_id", label: "Channel ID", placeholder: "C012ABC34", help: "Optional default channel for triage notifications." }
    ]
  },
  github: {
    label: "GitHub",
    description: "Enrich alerts with repository, commit, pull request, and ownership context.",
    icon: Github,
    defaults: { display_name: "", repository_full_name: "", installation_id: "" },
    fields: [
      { key: "display_name", label: "Connection name", placeholder: "Phoenix incidents monorepo", required: true, help: "A recognizable name for this repository connection." },
      { key: "repository_full_name", label: "Repository", placeholder: "acme/api", required: true, help: "Use the owner/repository format." },
      { key: "installation_id", label: "App installation ID", placeholder: "12345678", help: "Optional GitHub App installation identifier." }
    ]
  },
  jira: {
    label: "Jira",
    description: "Create approved developer work in the correct Jira project and board.",
    icon: TicketCheck,
    defaults: { display_name: "", site_url: "", project_key: "" },
    fields: [
      { key: "display_name", label: "Connection name", placeholder: "Security Engineering board", required: true, help: "A recognizable name for this Jira destination." },
      { key: "site_url", label: "Jira site URL", placeholder: "https://acme.atlassian.net", required: true, help: "The base URL for your Jira Cloud site." },
      { key: "project_key", label: "Project key", placeholder: "SEC", required: true, help: "Approved incidents will be routed to this project." }
    ]
  },
  openai: {
    label: "OpenAI",
    description: "Generate incident narratives, severity rationale, ownership, and fix guidance.",
    icon: Bot,
    defaults: { display_name: "", model: "gpt-4.1-mini", organization_id: "" },
    fields: [
      { key: "display_name", label: "Connection name", placeholder: "Incident analysis", required: true, help: "A recognizable name for this analysis configuration." },
      { key: "model", label: "Model", placeholder: "gpt-4.1-mini", required: true, help: "The model recorded for incident analysis." },
      { key: "organization_id", label: "Organization ID", placeholder: "org_...", help: "Optional organization metadata for audit context." }
    ]
  }
};

const providerOrder = Object.keys(providers) as IntegrationType[];

function statusMeta(status: string) {
  if (status === "configured") return { label: "Configured", tone: "configured" };
  if (status === "disabled") return { label: "Disabled", tone: "disabled" };
  return { label: "Setup required", tone: "pending" };
}

function relativeTime(value: string) {
  const elapsed = Math.max(1, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function integrationName(integration: Integration) {
  const config = integration.config_json;
  const candidate = config.display_name ?? config.name ?? config.workspace ?? config.repository_full_name ?? config.project_key ?? config.model;
  return typeof candidate === "string" && candidate.trim() ? candidate : `${providers[integration.type].label} integration`;
}

function previewEntries(integration: Integration) {
  const hidden = new Set(["display_name", "name"]);
  return Object.entries(integration.config_json)
    .filter(([key, value]) => !hidden.has(key) && value !== "" && value !== null && value !== undefined)
    .slice(0, 3);
}

function displayValue(value: unknown) {
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

export default function IntegrationsPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Integration | null>(null);
  const [providerType, setProviderType] = useState<IntegrationType>("slack");
  const [config, setConfig] = useState<Record<string, ConfigValue>>({ ...providers.slack.defaults });

  async function load() {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      setIntegrations(await api.integrations());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load integrations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  const activeCount = useMemo(
    () => integrations.filter((integration) => integration.status === "configured").length,
    [integrations]
  );

  function startCreate(type: IntegrationType = "slack") {
    setEditing(null);
    setProviderType(type);
    setConfig({ ...providers[type].defaults });
    setError("");
    setNotice("");
    setDrawerOpen(true);
  }

  function startManage(integration: Integration) {
    setEditing(integration);
    setProviderType(integration.type);
    setConfig({ ...providers[integration.type].defaults, ...integration.config_json });
    setError("");
    setNotice("");
    setDrawerOpen(true);
  }

  function changeProvider(type: IntegrationType) {
    setProviderType(type);
    setConfig({ ...providers[type].defaults });
  }

  function setField(key: string, value: string) {
    setConfig((current) => ({ ...current, [key]: value }));
  }

  async function save(status: "configured" | "needs_credentials") {
    const provider = providers[providerType];
    const missingRequired = provider.fields.some(
      (field) => field.required && !String(config[field.key] ?? "").trim()
    );
    if (status === "configured" && missingRequired) {
      setError("Complete every required field before activating this integration, or save it as a draft.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    const cleanedConfig = Object.fromEntries(
      Object.entries(config).filter(([, value]) => value !== "" && value !== null && value !== undefined)
    );

    try {
      if (editing) {
        const nextStatus = editing.status === "disabled" ? "disabled" : status;
        await api.updateIntegration(editing.id, { status: nextStatus, config_json: cleanedConfig });
        setNotice(`${provider.label} integration updated.`);
      } else {
        await api.createIntegration({ type: providerType, status, config_json: cleanedConfig });
        setNotice(status === "configured" ? `${provider.label} integration added.` : `${provider.label} draft saved.`);
      }
      setDrawerOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save integration");
    } finally {
      setSaving(false);
    }
  }

  async function toggleIntegration() {
    if (!editing) return;
    const nextStatus = editing.status === "disabled" ? "configured" : "disabled";
    setSaving(true);
    setError("");
    try {
      await api.updateIntegration(editing.id, { status: nextStatus });
      setNotice(`${providers[editing.type].label} integration ${nextStatus === "disabled" ? "disabled" : "enabled"}.`);
      setDrawerOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update integration status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="integrations-page">
      <header className="section-header integrations-header">
        <div>
          <h1>Integrations</h1>
          <p>
            Connect alert sources and ticket destinations. {activeCount} of {integrations.length || providerOrder.length} configured.
          </p>
        </div>
        <div className="section-actions">
          <button className="button secondary icon-only" onClick={() => void load()} title="Refresh integrations" aria-label="Refresh integrations">
            <RefreshCw size={16} aria-hidden />
          </button>
          <button className="button primary" onClick={() => startCreate()}>
            <Plus size={16} aria-hidden />
            Add integration
          </button>
        </div>
      </header>

      {error && !drawerOpen ? <div className="error error-banner" role="alert"><span>{error}</span><button onClick={() => void load()}>Retry</button></div> : null}
      {notice ? <div className="success-banner" role="status" aria-live="polite"><Check size={16} aria-hidden /> {notice}</div> : null}

      {loading ? (
        <div className="integration-skeleton-grid" role="status" aria-label="Loading integrations">
          {Array.from({ length: 4 }, (_, index) => <div className="integration-skeleton" key={index} />)}
        </div>
      ) : integrations.length ? (
        <section className="integration-card-grid" aria-label="Configured integrations">
          {integrations.map((integration) => {
            const provider = providers[integration.type];
            const Icon = provider.icon;
            const status = statusMeta(integration.status);
            const entries = previewEntries(integration);
            return (
              <article className="integration-card" key={integration.id}>
                <div className="integration-card-topline">
                  <span className="provider-icon"><Icon size={19} aria-hidden /></span>
                  <span className={`integration-state ${status.tone}`}><i /> {status.label}</span>
                </div>
                <div className="integration-card-copy">
                  <h2>{integrationName(integration)}</h2>
                  <p>{provider.label}</p>
                  <small>Updated {relativeTime(integration.updated_at)}</small>
                </div>
                <dl className="integration-config-preview">
                  {entries.length ? entries.map(([key, value]) => (
                    <div key={key}>
                      <dt>{key.replace(/_/g, " ")}</dt>
                      <dd>{displayValue(value)}</dd>
                    </div>
                  )) : <div><dt>routing metadata</dt><dd>Not configured</dd></div>}
                </dl>
                <button className="integration-manage-button" onClick={() => startManage(integration)}>
                  <Settings2 size={15} aria-hidden />
                  Manage
                </button>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="integration-empty">
          <span className="provider-icon"><Plus size={20} aria-hidden /></span>
          <h2>Connect your first system</h2>
          <p>Start with the alert source or ticket destination your team already uses.</p>
          <button className="button primary" onClick={() => startCreate()}>Add integration</button>
        </section>
      )}

      <section className="available-providers" aria-labelledby="available-provider-title">
        <div>
          <h2 id="available-provider-title">Supported providers</h2>
          <p>Routing metadata is tenant-scoped and every change is written to the audit log.</p>
        </div>
        <div className="provider-shortcuts">
          {providerOrder.map((type) => {
            const provider = providers[type];
            const Icon = provider.icon;
            return (
              <button key={type} onClick={() => startCreate(type)}>
                <Icon size={16} aria-hidden /> {provider.label}
              </button>
            );
          })}
        </div>
      </section>

      {drawerOpen ? (
        <div className="integration-drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setDrawerOpen(false)}>
          <aside className="integration-drawer" role="dialog" aria-modal="true" aria-labelledby="integration-drawer-title">
            <header>
              <div>
                <span className="drawer-kicker">{editing ? "Manage integration" : "New integration"}</span>
                <h2 id="integration-drawer-title">{editing ? integrationName(editing) : `Connect ${providers[providerType].label}`}</h2>
              </div>
              <button className="icon-button" onClick={() => setDrawerOpen(false)} title="Close integration settings" aria-label="Close integration settings">
                <X size={18} aria-hidden />
              </button>
            </header>

            <div className="drawer-body">
              {!editing ? (
                <fieldset className="provider-picker">
                  <legend>Provider</legend>
                  <div>
                    {providerOrder.map((type) => {
                      const provider = providers[type];
                      const Icon = provider.icon;
                      return (
                        <button
                          aria-pressed={providerType === type}
                          className={providerType === type ? "selected" : ""}
                          key={type}
                          onClick={() => changeProvider(type)}
                          type="button"
                        >
                          <Icon size={17} aria-hidden />
                          {provider.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ) : null}

              <div className="drawer-provider-summary">
                {(() => {
                  const Icon = providers[providerType].icon;
                  return <span className="provider-icon"><Icon size={19} aria-hidden /></span>;
                })()}
                <div>
                  <strong>{providers[providerType].label}</strong>
                  <p>{providers[providerType].description}</p>
                </div>
              </div>

              {error && drawerOpen ? <div className="error" role="alert"><AlertCircle size={16} aria-hidden /> {error}</div> : null}

              <form className="integration-form" onSubmit={(event) => { event.preventDefault(); void save("configured"); }}>
                {providers[providerType].fields.map((field) => (
                  <label className="field" key={field.key}>
                    <span>{field.label}{field.required ? <b aria-hidden> *</b> : null}</span>
                    <input
                      className="input"
                      name={field.key}
                      onChange={(event) => setField(field.key, event.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                      value={String(config[field.key] ?? "")}
                    />
                    <small>{field.help}</small>
                  </label>
                ))}

                <div className="credential-note">
                  <AlertCircle size={16} aria-hidden />
                  <p><strong>Credentials stay server-managed.</strong> This MVP stores routing metadata here; tokens and signing secrets remain environment-managed.</p>
                </div>

                {editing ? (
                  <button className={`integration-power-action ${editing.status === "disabled" ? "enable" : "disable"}`} disabled={saving} onClick={() => void toggleIntegration()} type="button">
                    <Power size={16} aria-hidden />
                    {editing.status === "disabled" ? "Enable integration" : "Disable integration"}
                  </button>
                ) : null}

                <footer className="drawer-actions">
                  <button className="button secondary" onClick={() => setDrawerOpen(false)} type="button">Cancel</button>
                  {!editing ? <button className="button secondary" disabled={saving} onClick={() => void save("needs_credentials")} type="button">Save draft</button> : null}
                  <button className="button primary" disabled={saving} type="submit">
                    {saving ? <Loader2 className="spin" size={16} aria-hidden /> : <Check size={16} aria-hidden />}
                    {editing ? "Save changes" : "Activate integration"}
                  </button>
                </footer>
              </form>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
