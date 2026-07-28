# Architecture

Security PR Copilot is split into a dashboard, an API, and a worker. The split keeps the UI responsive, keeps webhook handling short, and moves expensive enrichment and AI calls into auditable background jobs.

## Services

- `apps/web`: Next.js dashboard for incident review, approval, integrations, settings, and audit history.
- `services/api`: FastAPI service for auth, REST endpoints, webhook receivers, policies, and persistence.
- `services/worker`: RQ worker process that imports the API package and executes queue jobs.
- Postgres + pgvector: source of truth for tenants, incidents, tickets, audit logs, and knowledge items.
- Redis: queue broker for enrichment, analysis, scoring, and ticket jobs.
- MinIO/S3: raw webhook payloads and evidence snapshots.

## Data Flow

```mermaid
flowchart LR
  Slack[Slack Alert] --> API[FastAPI Webhook]
  GitHub[GitHub Event] --> API
  API --> DB[(Postgres)]
  API --> S3[(MinIO/S3)]
  API --> Redis[(Redis Queue)]
  Redis --> Worker[Worker]
  Worker --> GitHubAPI[GitHub API]
  Worker --> OpenAI[OpenAI]
  Worker --> Jira[Jira API]
  Worker --> DB
  Web[Next.js Dashboard] --> API
```

## Incident State Machine

```mermaid
stateDiagram-v2
  [*] --> received
  received --> enriched
  enriched --> summarized
  summarized --> approved
  approved --> ticketed
  ticketed --> closed
  summarized --> closed
```

## Trust Boundaries

- Webhook endpoints validate Slack/GitHub signatures before processing.
- JWT auth protects tenant data and app APIs.
- Tenant filters are applied at query boundaries.
- Risky external actions require explicit approval.
- All AI-generated recommendations and ticket creation actions produce audit log rows.

## Data Model

```mermaid
erDiagram
  TENANTS ||--o{ USERS : has
  TENANTS ||--o{ INTEGRATIONS : has
  TENANTS ||--o{ ALERTS : receives
  ALERTS ||--o{ INCIDENTS : becomes
  INCIDENTS ||--o{ INCIDENT_EVIDENCE : contains
  INCIDENTS ||--o{ RECOMMENDATIONS : has
  INCIDENTS ||--o{ TICKETS : creates
  TENANTS ||--o{ AUDIT_LOGS : records
  TENANTS ||--o{ KNOWLEDGE_ITEMS : stores
  USERS ||--o{ AUDIT_LOGS : performs
  USERS ||--o{ INCIDENTS : owns
```

