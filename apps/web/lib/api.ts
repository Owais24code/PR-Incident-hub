import type { AuditLog, AuthResponse, Incident, IncidentDetail, Integration, JobResponse, User } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const TOKEN_KEY = "security-pr-copilot-token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(typeof body.detail === "string" ? body.detail : "Request failed");
  }

  return response.json() as Promise<T>;
}

export const api = {
  register: (tenant_name: string, name: string, email: string, password: string) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ tenant_name, name, email, password })
    }),
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  me: () => request<User>("/me"),
  incidents: (params = "") => request<Incident[]>(`/incidents${params}`),
  incident: (id: string) => request<IncidentDetail>(`/incidents/${id}`),
  analyzeIncident: (id: string) =>
    request<JobResponse>(`/incidents/${id}/analyze`, {
      method: "POST"
    }),
  approveIncident: (id: string) =>
    request<IncidentDetail>(`/incidents/${id}/approve`, {
      method: "POST"
    }),
  createTicket: (id: string) =>
    request<JobResponse>(`/incidents/${id}/create-ticket`, {
      method: "POST"
    }),
  integrations: () => request<Integration[]>("/integrations"),
  createIntegration: (integration: Pick<Integration, "type" | "status" | "config_json">) =>
    request<Integration>("/integrations", {
      method: "POST",
      body: JSON.stringify(integration)
    }),
  updateIntegration: (id: string, payload: Partial<Pick<Integration, "status" | "config_json">>) =>
    request<Integration>(`/integrations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  auditLogs: () => request<AuditLog[]>("/audit-logs")
};
