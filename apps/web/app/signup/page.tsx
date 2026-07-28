"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api, setToken } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [tenantName, setTenantName] = useState("Acme Security");
  const [name, setName] = useState("Security Lead");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.register(tenantName, name, email, password);
      setToken(response.access_token);
      router.push("/analytics");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-wrap">
      <section className="login-card signup-card">
        <div className="status-row" aria-label="Signup status">
          <span>WORKSPACE SETUP</span>
          <span className="signal">READY</span>
        </div>
        <p className="eyebrow">Create your security console</p>
        <h1>Start turning alerts into approved work.</h1>
        <p className="muted">Create a tenant, invite your team later, and land directly in the incident console.</p>
        <form className="form" onSubmit={submit}>
          {error ? <div className="error" role="alert">{error}</div> : null}
          <label className="field">
            Workspace
            <input autoComplete="organization" className="input" name="organization" required value={tenantName} onChange={(event) => setTenantName(event.target.value)} />
          </label>
          <label className="field">
            Your Name
            <input autoComplete="name" className="input" name="name" required value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="field">
            Email
            <input autoComplete="email" className="input" name="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="field">
            Password
            <input
              className="input"
              autoComplete="new-password"
              minLength={10}
              name="password"
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 10 characters"
            />
          </label>
          <button className="icon-text-button" disabled={loading} type="submit">
            <ShieldCheck size={18} aria-hidden />
            <span>{loading ? "Creating Workspace" : "Create Workspace"}</span>
            <ArrowRight size={17} aria-hidden />
          </button>
        </form>
        <p className="auth-switch">
          Already have a workspace? <Link href="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}
