# Security Review

## Implemented Controls

- Passwords are hashed before storage.
- JWTs include issuer, subject, tenant, role, issued-at, and expiration claims.
- Slack webhook signatures are verified using timestamped HMAC.
- GitHub webhook signatures are verified using `X-Hub-Signature-256`.
- Integration secrets are stored server-side only and never exposed to the web app.
- Incident analysis and ticket creation write audit log entries.
- Ticket creation requires an approved incident.
- Tenant-scoped endpoints filter by `tenant_id`.

## AI Safety Gates

- OpenAI output is parsed into a strict Pydantic schema.
- The app stores AI confidence and severity rationale for review.
- Jira ticket creation remains human-approved in the MVP.
- Future PR draft/remediation actions should use the same approval policy.

## Known MVP Risks

- Custom JWT auth is intentionally small; production deployments should add refresh tokens, password reset, MFA, account lockout, and session revocation.
- Integration config values are stored in JSON for MVP speed. Production should encrypt secrets with KMS or a vault.
- GitHub owner suggestion is heuristic plus model-assisted. It should be validated against CODEOWNERS and team mappings before automated routing.
- Webhook tenant resolution uses configured defaults and event metadata. Real multi-workspace installs should bind webhook signing secrets to a specific tenant/integration.
- The frontend stores access tokens in `localStorage`; a hardened production build should move to secure, httpOnly cookies.

