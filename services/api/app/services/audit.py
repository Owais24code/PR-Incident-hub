from sqlalchemy.orm import Session

from app.models import AuditLog


def write_audit(
    db: Session,
    *,
    tenant_id: str,
    action: str,
    target_type: str,
    target_id: str,
    actor_user_id: str | None = None,
    metadata: dict | None = None,
) -> AuditLog:
    row = AuditLog(
        tenant_id=tenant_id,
        actor_user_id=actor_user_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        metadata_json=metadata or {},
    )
    db.add(row)
    db.flush()
    return row

