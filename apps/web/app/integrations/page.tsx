"use client";

import { Plus, RefreshCw, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { api, getToken } from "@/lib/api";
import type { Integration } from "@/lib/types";

export default function IntegrationsPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [type, setType] = useState<Integration["type"]>("slack");
  const [status, setStatus] = useState("configured");
  const [configText, setConfigText] = useState("{\n  \"team_id\": \"T_DEMO\"\n}");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    setError("");
    try {
      setIntegrations(await api.integrations());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load integrations");
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const config = JSON.parse(configText) as Record<string, unknown>;
      await api.createIntegration({ type, status, config_json: config });
      setNotice("Integration saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save integration");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Connected systems</p>
          <h1>Integrations</h1>
          <p className="muted">Configure Slack, GitHub, Jira, and OpenAI metadata for tenant-aware workflows.</p>
        </div>
        <button className="icon-text-button" onClick={() => void load()} title="Refresh integrations">
          <RefreshCw size={17} aria-hidden />
          <span>Refresh</span>
        </button>
      </header>

      {error ? <div className="error">{error}</div> : null}
      {notice ? <div className="card">{notice}</div> : null}

      <section className="grid two">
        <form className="card form" onSubmit={submit}>
          <h2>Add Integration</h2>
          <label className="field">
            Type
            <select className="select" value={type} onChange={(event) => setType(event.target.value as Integration["type"])}>
              <option value="slack">Slack</option>
              <option value="github">GitHub</option>
              <option value="jira">Jira</option>
              <option value="openai">OpenAI</option>
            </select>
          </label>
          <label className="field">
            Status
            <select className="select" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="configured">Configured</option>
              <option value="needs_credentials">Needs Credentials</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>
          <label className="field">
            Config JSON
            <textarea className="textarea" value={configText} onChange={(event) => setConfigText(event.target.value)} />
          </label>
          <button className="icon-text-button" type="submit">
            <Plus size={17} aria-hidden />
            <span>Add Integration</span>
          </button>
        </form>

        <section className="card">
          <h2>Configured</h2>
          <div className="grid">
            {integrations.map((integration) => (
              <article className="integration-item" key={integration.id}>
                <h3>{integration.type}</h3>
                <p>
                  <StatusBadge value={integration.status} />
                </p>
                <pre className="json-block">{JSON.stringify(integration.config_json, null, 2)}</pre>
                <button
                  className="icon-text-button secondary"
                  onClick={() =>
                    void api
                      .updateIntegration(integration.id, { status: integration.status })
                      .then(() => setNotice("Integration checked."))
                  }
                  title="Save integration"
                >
                  <Save size={17} aria-hidden />
                  <span>Save</span>
                </button>
              </article>
            ))}
            {integrations.length === 0 ? <p className="muted">No integrations configured yet.</p> : null}
          </div>
        </section>
      </section>
    </>
  );
}
