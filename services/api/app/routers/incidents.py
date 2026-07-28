from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, or_, select
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.dependencies import get_current_user
from app.models import Alert, Incident, User
from app.schemas import IncidentDetailOut, IncidentOut, JobOut
from app.services.audit import write_audit
from app.services.policy import assert_ticket_creation_allowed
from app.services.queue import enqueue_job

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.get("", response_model=list[IncidentOut])
def list_incidents(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    q: str | None = None,
    status: str | None = None,
    severity: str | None = None,
) -> list[Incident]:
    stmt = (
        select(Incident)
        .options(selectinload(Incident.alert))
        .where(Incident.tenant_id == user.tenant_id)
        .order_by(desc(Incident.created_at))
    )
    if status:
        stmt = stmt.where(Incident.status == status)
    if severity:
        stmt = stmt.where(Incident.severity == severity)
    if q:
        stmt = stmt.join(Alert).where(or_(Incident.summary.ilike(f"%{q}%"), Alert.title.ilike(f"%{q}%")))
    return list(db.scalars(stmt))


@router.get("/{incident_id}", response_model=IncidentDetailOut)
def get_incident(
    incident_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Incident:
    incident = db.scalar(
        select(Incident)
        .options(
            selectinload(Incident.alert),
            selectinload(Incident.evidence),
            selectinload(Incident.recommendations),
            selectinload(Incident.tickets),
        )
        .where(Incident.id == incident_id, Incident.tenant_id == user.tenant_id)
    )
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.post("/{incident_id}/analyze", response_model=JobOut)
def analyze_incident(
    incident_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> JobOut:
    incident = get_incident(incident_id, db, user)
    job = enqueue_job("app.workers.jobs.analyze_incident", incident.id, user.id)
    write_audit(
        db,
        tenant_id=user.tenant_id,
        actor_user_id=user.id,
        action="incident.analysis_requested",
        target_type="incident",
        target_id=incident.id,
        metadata={"job_id": job.id},
    )
    db.commit()
    return JobOut(job_id=job.id, status="queued")


@router.post("/{incident_id}/approve", response_model=IncidentDetailOut)
def approve_incident(
    incident_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Incident:
    incident = get_incident(incident_id, db, user)
    if not incident.summary:
        raise HTTPException(status_code=409, detail="Incident must be analyzed before approval")
    incident.status = "approved"
    write_audit(
        db,
        tenant_id=user.tenant_id,
        actor_user_id=user.id,
        action="incident.approved",
        target_type="incident",
        target_id=incident.id,
    )
    db.commit()
    db.refresh(incident)
    return get_incident(incident.id, db, user)


@router.post("/{incident_id}/create-ticket", response_model=JobOut)
def create_ticket(
    incident_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> JobOut:
    incident = get_incident(incident_id, db, user)
    assert_ticket_creation_allowed(incident)
    job = enqueue_job("app.workers.jobs.create_ticket", incident.id, user.id)
    write_audit(
        db,
        tenant_id=user.tenant_id,
        actor_user_id=user.id,
        action="ticket.creation_requested",
        target_type="incident",
        target_id=incident.id,
        metadata={"job_id": job.id},
    )
    db.commit()
    return JobOut(job_id=job.id, status="queued")
