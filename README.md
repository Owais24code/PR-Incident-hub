# Security PR Copilot

Security PR Copilot is a narrow B2B devtool that turns security alerts into developer-ready incident work. It ingests Slack and GitHub events, enriches them with repository and ticketing context, asks OpenAI for a safe incident narrative, and keeps human approval in front of ticket creation.

## Stack

- `apps/web`: Next.js App Router dashboard.
- `services/api`: FastAPI API, SQLAlchemy models, Alembic migrations.
- `services/worker`: Redis/RQ worker entrypoint.
- Postgres + pgvector for relational data and incident memory.
- Redis for background jobs.
- MinIO/S3-compatible storage for raw payload and evidence snapshots.

## Local Setup

1. Copy the environment file.

   ```powershell
   Copy-Item .env.example .env
   ```

2. Fill in required secrets in `.env`.

   - `JWT_SECRET`
   - `OPENAI_API_KEY`
   - `SLACK_SIGNING_SECRET` for real Slack webhooks
   - `GITHUB_WEBHOOK_SECRET` and `GITHUB_TOKEN` for GitHub enrichment
   - Jira variables for ticket creation

3. Start infrastructure and services.

   ```powershell
   docker compose up --build
   ```

4. Run migrations.

   ```powershell
   cd services/api
   alembic upgrade head
   ```

5. Seed a demo tenant/user/incident.

   ```powershell
   python ..\..\scripts\seed_demo.py
   ```

6. Start the web app in another terminal.

   ```powershell
   npm install
   npm run dev:web
   ```

The dashboard runs at `http://localhost:3000`; the API runs at `http://localhost:8000`.

## Demo Login

After running the seed script:

- Email: `admin@example.com`
- Password: `Password123!`

## Demo Flow

1. Open the incident list.
2. Select the seeded incident or send a Slack-style webhook payload to `POST /webhooks/slack`.
3. Click Analyze on an incident detail page.
4. Review summary, severity, owner suggestion, and recommendation.
5. Approve the incident.
6. Create a Jira ticket.
7. Review the audit log.

## Useful Commands

```powershell
npm run lint:web
npm run build:web
npm run test:api
cd services/api; pytest
cd services/api; alembic revision --autogenerate -m "message"
cd services/api; alembic upgrade head
```

## Integration Notes

- Slack requests are verified with `SLACK_SIGNING_SECRET`.
- GitHub webhooks are verified with `GITHUB_WEBHOOK_SECRET`.
- Jira ticket creation requires `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, and `JIRA_PROJECT_KEY`.
- OpenAI is required for production analysis. The API refuses analysis when `OPENAI_API_KEY` is missing.

## Architecture and Review

- System design: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Security review: [docs/SECURITY_REVIEW.md](docs/SECURITY_REVIEW.md)

