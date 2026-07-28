"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api, setToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.login(email, password);
      setToken(response.access_token);
      router.push("/incidents");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-wrap">
      <section className="login-card">
        <div className="status-row" aria-label="Console status">
          <span>SOC CONSOLE</span>
          <span className="signal">SECURE</span>
        </div>
        <p className="eyebrow">Developer-ready security response</p>
        <h1>Security PR Copilot</h1>
        <p className="muted">Sign in to triage alerts, approve actions, and create Jira work.</p>
        <form className="form" onSubmit={submit}>
          {error ? <div className="error">{error}</div> : null}
          <label className="field">
            Email
            <input className="input" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="field">
            Password
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button className="icon-text-button" disabled={loading} type="submit">
            <ShieldCheck size={18} aria-hidden />
            <span>{loading ? "Signing In" : "Sign In"}</span>
          </button>
        </form>
      </section>
    </main>
  );
}
