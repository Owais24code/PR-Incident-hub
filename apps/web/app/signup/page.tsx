"use client";

import { AlertCircle, ArrowRight, Building2, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { api, setToken } from "@/lib/api";

function passwordScore(password: string) {
  if (!password) return { score: 0, label: "Enter at least 10 characters" };
  let score = password.length >= 10 ? 1 : 0;
  if (password.length >= 14) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  return { score, label: ["Too short", "Basic", "Good", "Strong", "Excellent"][score] };
}

export default function SignupPage() {
  const router = useRouter();
  const [tenantName, setTenantName] = useState("Acme Security");
  const [name, setName] = useState("Security Lead");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const strength = useMemo(() => passwordScore(password), [password]);

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
    <AuthShell>
      <div className="auth-form-shell signup">
        <div className="auth-form-heading">
          <p className="public-kicker">Tenant setup</p>
          <h1>Create your workspace</h1>
          <p>Start with one alert source, then connect code context and your Jira destination.</p>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {error ? <div className="auth-error" role="alert"><AlertCircle size={16} aria-hidden /><span>{error}</span></div> : null}
          <div className="auth-field-row">
            <label className="auth-field" htmlFor="organization"><span>Workspace</span><span className="auth-input-shell"><Building2 size={16} aria-hidden /><input autoComplete="organization" id="organization" name="organization" required value={tenantName} onChange={(event) => setTenantName(event.target.value)} /></span></label>
            <label className="auth-field" htmlFor="name"><span>Your name</span><span className="auth-input-shell"><UserRound size={16} aria-hidden /><input autoComplete="name" id="name" name="name" required value={name} onChange={(event) => setName(event.target.value)} /></span></label>
          </div>
          <label className="auth-field" htmlFor="signup-email"><span>Work email</span><span className="auth-input-shell"><Mail size={16} aria-hidden /><input autoComplete="email" id="signup-email" name="email" placeholder="you@company.com" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></span></label>
          <label className="auth-field" htmlFor="signup-password"><span>Password</span><span className="auth-input-shell"><LockKeyhole size={16} aria-hidden /><input autoComplete="new-password" id="signup-password" minLength={10} name="password" placeholder="Minimum 10 characters" required type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} /><button aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="auth-password-toggle" onClick={() => setShowPassword((visible) => !visible)} type="button">{showPassword ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}</button></span></label>
          <div className="auth-strength" aria-live="polite"><span>{[0, 1, 2, 3].map((level) => <i className={level < strength.score ? "active" : ""} key={level} />)}</span><small>{strength.label}</small></div>
          <button className="auth-submit" disabled={loading} type="submit">{loading ? <LoaderCircle className="spin" size={17} aria-hidden /> : <ArrowRight size={17} aria-hidden />}<span>{loading ? "Creating workspace" : "Create workspace"}</span></button>
        </form>
        <p className="auth-switch">Already have a workspace? <Link href="/login">Sign in</Link></p>
      </div>
    </AuthShell>
  );
}
