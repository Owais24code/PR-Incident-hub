import json
from datetime import UTC, datetime
from urllib.parse import parse_qs

from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Alert, Incident, Integration, Tenant
from app.security import verify_github_signature, verify_slack_signature
from app.services.audit import write_audit
from app.services.object_storage import put_json
from app.services.queue import enqueue_job

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def _first_tenant(db: Session) -> Tenant:
    tenant = db.scalar(select(Tenant).order_by(Tenant.created_at).limit(1))
    if tenant:
        return tenant
    tenant = Tenant(name="Default Tenant", plan="starter")
    db.add(tenant)
    db.flush()
    return tenant


def _tenant_for_integration(db: Session, integration_type: str, external_id: str | None) -> Tenant:
    if external_id:
        integrations = db.scalars(
            select(Integration).where(Integration.type == integration_type, Integration.status == "configured")
        )
        for integration in integrations:
            config = integration.config_json or {}
            if external_id in {
                config.get("team_id"),
                config.get("workspace_id"),
                config.get("installation_id"),
                config.get("repository_full_name"),
            }:
                tenant = db.get(Tenant, integration.tenant_id)
                if tenant:
                    return tenant
    return _first_tenant(db)


def _create_alert_incident(
    db: Session,
    *,
    tenant_id: str,
    source_type: str,
    source_event_id: str,
    severity: str,
    title: str,
    payload: dict,
) -> Incident:
    existing_alert = db.scalar(
        select(Alert).where(
            Alert.tenant_id == tenant_id,
            Alert.source_type == source_type,
            Alert.source_event_id == source_event_id,
        )
    )
    if existing_alert:
        existing_incident = db.scalar(select(Incident).where(Incident.alert_id == existing_alert.id))
        if existing_incident:
            return existing_incident

    object_key = put_json(f"alerts/{tenant_id}/{source_type}/{source_event_id}.json", payload)
    alert = Alert(
        tenant_id=tenant_id,
        source_type=source_type,
        source_event_id=source_event_id,
        severity=severity,
        title=title,
        raw_payload_json=payload,
        raw_payload_object_key=object_key or None,
    )
    db.add(alert)
    db.flush()
    incident = Incident(
        tenant_id=tenant_id,
        alert_id=alert.id,
        severity=severity,
        status="received",
    )
    db.add(incident)
    db.flush()
    write_audit(
        db,
        tenant_id=tenant_id,
        action="alert.received",
        target_type="incident",
        target_id=incident.id,
        metadata={"source_type": source_type, "source_event_id": source_event_id},
    )
    return incident


def _slack_payload(raw_body: bytes, content_type: str | None) -> dict:
    if content_type and "application/json" in content_type:
        return json.loads(raw_body.decode("utf-8") or "{}")
    parsed = parse_qs(raw_body.decode("utf-8"))
    if "payload" in parsed:
        return json.loads(parsed["payload"][0])
    return {key: values[0] if len(values) == 1 else values for key, values in parsed.items()}


@router.post("/slack")
async def slack_webhook(request: Request, db: Session = Depends(get_db)) -> dict:
    raw_body = await request.body()
    await verify_slack_signature(request, raw_body)
    payload = _slack_payload(raw_body, request.headers.get("content-type"))

    if payload.get("type") == "url_verification":
        return {"challenge": payload.get("challenge")}

    team_id = payload.get("team_id") or payload.get("team", {}).get("id")
    tenant = _tenant_for_integration(db, "slack", team_id)
    event = payload.get("event") or payload
    event_id = (
        payload.get("event_id")
        or payload.get("trigger_id")
        or event.get("event_ts")
        or datetime.now(UTC).isoformat()
    )
    title = event.get("text") or payload.get("callback_id") or "Slack security alert"
    severity = event.get("severity") or payload.get("severity") or "unknown"

    incident = _create_alert_incident(
        db,
        tenant_id=tenant.id,
        source_type="slack",
        source_event_id=str(event_id),
        severity=str(severity).lower(),
        title=str(title)[:500],
        payload=payload,
    )
    db.commit()
    job = enqueue_job("app.workers.jobs.enrich_alert", incident.id, None)
    return {"incident_id": incident.id, "job_id": job.id, "status": incident.status}


@router.post("/github")
async def github_webhook(
    request: Request,
    db: Session = Depends(get_db),
    x_github_event: str | None = Header(default=None),
    x_github_delivery: str | None = Header(default=None),
    x_hub_signature_256: str | None = Header(default=None),
) -> dict:
    raw_body = await request.body()
    verify_github_signature(raw_body, x_hub_signature_256)
    payload = json.loads(raw_body.decode("utf-8") or "{}")

    repo_full_name = payload.get("repository", {}).get("full_name")
    tenant = _tenant_for_integration(db, "github", repo_full_name)
    event_id = x_github_delivery or payload.get("after") or datetime.now(UTC).isoformat()
    event_name = x_github_event or "github"
    title = (
        payload.get("alert", {}).get("security_advisory", {}).get("summary")
        or payload.get("repository", {}).get("full_name")
        or f"GitHub {event_name} event"
    )
    severity = payload.get("alert", {}).get("security_advisory", {}).get("severity") or "unknown"

    incident = _create_alert_incident(
        db,
        tenant_id=tenant.id,
        source_type="github",
        source_event_id=str(event_id),
        severity=str(severity).lower(),
        title=str(title)[:500],
        payload=payload,
    )
    db.commit()
    job = enqueue_job("app.workers.jobs.enrich_alert", incident.id, None)
    return {"incident_id": incident.id, "job_id": job.id, "status": incident.status}
