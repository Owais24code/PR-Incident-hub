from sqlalchemy import select

from app.db import SessionLocal
from app.models import Alert, Incident, Integration, Recommendation, Tenant, User
from app.security import hash_password
from app.services.audit import write_audit


def main() -> None:
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == "admin@example.com"))
        if user:
            print("Demo seed already exists: admin@example.com")
            return

        tenant = Tenant(name="Acme Security", plan="starter")
        db.add(tenant)
        db.flush()

        user = User(
            tenant_id=tenant.id,
            email="admin@example.com",
            name="Demo Admin",
            role="admin",
            password_hash=hash_password("Password123!"),
        )
        db.add(user)
        db.flush()

        db.add_all(
            [
                Integration(
                    tenant_id=tenant.id,
                    type="slack",
                    status="configured",
                    config_json={"team_id": "T_DEMO", "workspace": "acme-security"},
                ),
                Integration(
                    tenant_id=tenant.id,
                    type="github",
                    status="configured",
                    config_json={"repository_full_name": "acme/api"},
                ),
                Integration(
                    tenant_id=tenant.id,
                    type="jira",
                    status="needs_credentials",
                    config_json={"project_key": "SEC"},
                ),
                Integration(
                    tenant_id=tenant.id,
                    type="openai",
                    status="configured",
                    config_json={"model": "gpt-4.1-mini"},
                ),
            ]
        )

        alert = Alert(
            tenant_id=tenant.id,
            source_type="slack",
            source_event_id="demo-alert-001",
            severity="high",
            title="High severity dependency alert in acme/api",
            raw_payload_json={
                "team_id": "T_DEMO",
                "event_id": "demo-alert-001",
                "event": {
                    "text": "Dependabot reported a high severity auth bypass dependency in acme/api.",
                    "severity": "high",
                    "repo": "acme/api",
                },
            },
        )
        db.add(alert)
        db.flush()

        incident = Incident(
            tenant_id=tenant.id,
            alert_id=alert.id,
            severity="high",
            status="summarized",
            risk_score=82,
            owner_suggestion="api-platform",
            summary=(
                "Dependabot reported a high severity dependency issue in acme/api. "
                "The likely fix path is to upgrade the vulnerable package, run auth regression tests, "
                "and deploy after review."
            ),
        )
        db.add(incident)
        db.flush()

        db.add(
            Recommendation(
                incident_id=incident.id,
                recommendation_text=(
                    "Open a Jira task for api-platform to upgrade the vulnerable dependency, "
                    "verify authentication regression coverage, and link the package advisory."
                ),
                confidence=0.81,
                requires_approval=True,
                severity_rationale="High severity because the alert references authentication bypass risk.",
            )
        )
        write_audit(
            db,
            tenant_id=tenant.id,
            actor_user_id=user.id,
            action="demo.seeded",
            target_type="incident",
            target_id=incident.id,
            metadata={"email": user.email},
        )
        db.commit()
        print("Seeded demo tenant, admin user, integrations, and incident.")


if __name__ == "__main__":
    main()

