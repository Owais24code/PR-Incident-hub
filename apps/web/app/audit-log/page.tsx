"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, getToken } from "@/lib/api";
import type { AuditLog } from "@/lib/types";

export default function AuditLogPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
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
      setLogs(await api.auditLogs());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load audit log");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Auditability</p>
          <h1>Audit Log</h1>
          <p className="muted">Every AI summary, approval, integration change, and ticket action is captured here.</p>
        </div>
        <button className="icon-text-button" onClick={() => void load()} title="Refresh audit log">
          <RefreshCw size={17} aria-hidden />
          <span>Refresh</span>
        </button>
      </header>

      {error ? <div className="error">{error}</div> : null}
      {loading ? <p className="muted">Loading audit log...</p> : null}

      <table className="table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Target</th>
            <th>Actor</th>
            <th>Metadata</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{log.action}</td>
              <td>
                {log.target_type}
                <br />
                <span className="muted">{log.target_id}</span>
              </td>
              <td>{log.actor_user_id || "system"}</td>
              <td>
                <pre className="json-block">{JSON.stringify(log.metadata_json, null, 2)}</pre>
              </td>
              <td>{new Date(log.created_at).toLocaleString()}</td>
            </tr>
          ))}
          {!loading && logs.length === 0 ? (
            <tr>
              <td colSpan={5} className="muted">
                No audit entries yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </>
  );
}

