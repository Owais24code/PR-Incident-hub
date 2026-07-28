from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db import SessionLocal
from app.models import Incident, IncidentEvidence, Recommendation, Ticket
from app.services.audit import write_audit
from app.services.github import enrich_incident_from_github
from app.services.jira import create_jira_ticket
from app.services.openai_analysis import generate_incident_analysis
from app.services.policy import assert_ticket_creation_allowed


def _load_incident(db, incident_id: str) -> Incident:
    incident = db.scalar(
        select(Incident)
        .options(
            selectinload(Incident.alert),
            selectinload(Incident.evidence),
            selectinload(Incident.recommendations),
            selectinload(Incident.tickets),
        )
        .where(Incident.id == incident_id)
    )
    if not incident:
        raise ValueError(f"Incident {incident_id} not found")
    return incident


def enrich_alert(incident_id: str, actor_user_id: str | None = None) -> dict:
    with SessionLocal() as db:
        incident = _load_incident(db, incident_id)
        if incident.status not in {"received", "enriched"}:
            return {"incident_id": incident.id, "status": incident.status, "skipped": True}

        if incident.alert.source_type == "github":
            evidence = enrich_incident_from_github(db, incident)
        else:
            evidence = [
                IncidentEvidence(
                    incident_id=incident.id,
                    evidence_type="message",
                    source=incident.alert.source_type,
                    reference_id=incident.alert.source_event_id,
                    content_json=incident.alert.raw_payload_json,
                )
            ]
            db.add_all(evidence)

        incident.status = "enriched"
        write_audit(
            db,
            tenant_id=incident.tenant_id,
            actor_user_id=actor_user_id,
            action="incident.enriched",
            target_type="incident",
            target_id=incident.id,
            metadata={"evidence_count": len(evidence)},
        )
        db.commit()
        return {"incident_id": incident.id, "status": incident.status, "evidence_count": len(evidence)}


def analyze_incident(incident_id: str, actor_user_id: str | None = None) -> dict:
    with SessionLocal() as db:
        incident = _load_incident(db, incident_id)
        if incident.status == "received":
            enrich_alert(incident_id, actor_user_id)
            db.expire_all()
            incident = _load_incident(db, incident_id)

        analysis = generate_incident_analysis(incident)
        incident.summary = analysis.summary
        incident.risk_score = analysis.risk_score
        incident.severity = analysis.severity
        incident.owner_suggestion = analysis.owner_suggestion
        incident.status = "summarized"

        recommendation = Recommendation(
            incident_id=incident.id,
            recommendation_text=analysis.recommendation_text,
            confidence=analysis.confidence,
            requires_approval=True,
            severity_rationale=analysis.severity_rationale,
        )
        db.add(recommendation)
        write_audit(
            db,
            tenant_id=incident.tenant_id,
            actor_user_id=actor_user_id,
            action="incident.summarized",
            target_type="incident",
            target_id=incident.id,
            metadata={
                "risk_score": analysis.risk_score,
                "severity": analysis.severity,
                "confidence": analysis.confidence,
            },
        )
        db.commit()
        return {"incident_id": incident.id, "status": incident.status, "risk_score": incident.risk_score}


def create_ticket(incident_id: str, actor_user_id: str | None = None) -> dict:
    with SessionLocal() as db:
        incident = _load_incident(db, incident_id)
        assert_ticket_creation_allowed(incident)
        if incident.tickets:
            latest = incident.tickets[-1]
            return {"incident_id": incident.id, "ticket_id": latest.external_ticket_id, "skipped": True}

        result = create_jira_ticket(incident)
        ticket = Ticket(
            incident_id=incident.id,
            external_system="jira",
            external_ticket_id=result["external_ticket_id"],
            external_url=result.get("external_url"),
            status=result.get("status", "created"),
        )
        incident.status = "ticketed"
        db.add(ticket)
        write_audit(
            db,
            tenant_id=incident.tenant_id,
            actor_user_id=actor_user_id,
            action="ticket.created",
            target_type="incident",
            target_id=incident.id,
            metadata={"external_ticket_id": ticket.external_ticket_id, "external_url": ticket.external_url},
        )
        db.commit()
        return {"incident_id": incident.id, "ticket_id": ticket.external_ticket_id}

