export type User = {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  role: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: "bearer";
  user: User;
};

export type Alert = {
  id: string;
  tenant_id: string;
  source_type: string;
  source_event_id: string;
  severity: string;
  title: string;
  raw_payload_json: Record<string, unknown>;
  raw_payload_object_key: string | null;
  created_at: string;
};

export type Evidence = {
  id: string;
  evidence_type: string;
  source: string;
  reference_id: string | null;
  content_json: Record<string, unknown>;
  object_key: string | null;
  created_at: string;
};

export type Recommendation = {
  id: string;
  recommendation_text: string;
  confidence: number;
  requires_approval: boolean;
  severity_rationale: string | null;
  created_at: string;
};

export type Ticket = {
  id: string;
  external_system: string;
  external_ticket_id: string;
  external_url: string | null;
  status: string;
  created_at: string;
};

export type Incident = {
  id: string;
  tenant_id: string;
  alert_id: string;
  summary: string | null;
  risk_score: number;
  severity: string;
  status: string;
  owner_user_id: string | null;
  owner_suggestion: string | null;
  created_at: string;
  updated_at: string;
};

export type IncidentDetail = Incident & {
  alert: Alert;
  evidence: Evidence[];
  recommendations: Recommendation[];
  tickets: Ticket[];
};

export type Integration = {
  id: string;
  tenant_id: string;
  type: "slack" | "github" | "jira" | "openai";
  status: string;
  config_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AuditLog = {
  id: string;
  tenant_id: string;
  actor_user_id: string | null;
  action: string;
  target_type: string;
  target_id: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
};

export type JobResponse = {
  job_id: string;
  status: string;
};

