"use client";

import { AlertCircle, ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, TerminalSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { api, setToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Password123!");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.login(email, password);
      setToken(response.access_token);
      router.push("/analytics");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="auth-form-shell">
        <div className="auth-form-heading">
          <p className="public-kicker">Secure workspace access</p>
          <h1>Welcome back</h1>
          <p>Sign in to review incidents, approve actions, and track security work.</p>
        </div>

        <div className="auth-demo-note"><TerminalSquare size={15} aria-hidden /><span>Local demo credentials are prefilled.</span></div>

        <form className="auth-form" onSubmit={submit}>
          {error ? <div className="auth-error" role="alert"><AlertCircle size={16} aria-hidden /><span>{error}</span></div> : null}
          <label className="auth-field" htmlFor="email">
            <span>Work email</span>
            <span className="auth-input-shell"><Mail size={16} aria-hidden /><input autoComplete="email" id="email" name="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></span>
          </label>
          <label className="auth-field" htmlFor="password">
            <span>Password</span>
            <span className="auth-input-shell"><LockKeyhole size={16} aria-hidden /><input autoComplete="current-password" id="password" name="password" required type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} /><button aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="auth-password-toggle" onClick={() => setShowPassword((visible) => !visible)} type="button">{showPassword ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}</button></span>
          </label>
          <button className="auth-submit" disabled={loading} type="submit">
            {loading ? <LoaderCircle className="spin" size={17} aria-hidden /> : <ArrowRight size={17} aria-hidden />}
            <span>{loading ? "Signing in" : "Sign in"}</span>
          </button>
        </form>
        <p className="auth-switch">New to Security PR Copilot? <Link href="/signup">Create a workspace</Link></p>
      </div>
    </AuthShell>
  );
}
