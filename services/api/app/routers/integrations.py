from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import require_admin
from app.models import Integration, User
from app.schemas import IntegrationIn, IntegrationOut, IntegrationPatch
from app.services.audit import write_audit

router = APIRouter(prefix="/integrations", tags=["integrations"])

SECRET_KEYS = {"token", "api_token", "secret", "password", "client_secret", "signing_secret"}


def _safe_integration(integration: Integration) -> IntegrationOut:
    config = {}
    for key, value in (integration.config_json or {}).items():
        if any(secret_key in key.lower() for secret_key in SECRET_KEYS):
            config[key] = "***redacted***"
        else:
            config[key] = value
    return IntegrationOut(
        id=integration.id,
        tenant_id=integration.tenant_id,
        type=integration.type,
        status=integration.status,
        config_json=config,
        created_at=integration.created_at,
        updated_at=integration.updated_at,
    )


@router.get("", response_model=list[IntegrationOut])
def list_integrations(
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
) -> list[IntegrationOut]:
    integrations = db.scalars(select(Integration).where(Integration.tenant_id == user.tenant_id))
    return [_safe_integration(integration) for integration in integrations]


@router.post("", response_model=IntegrationOut, status_code=201)
def create_integration(
    payload: IntegrationIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
) -> IntegrationOut:
    integration = Integration(
        tenant_id=user.tenant_id,
        type=payload.type,
        status=payload.status,
        config_json=payload.config_json,
    )
    db.add(integration)
    db.flush()
    write_audit(
        db,
        tenant_id=user.tenant_id,
        actor_user_id=user.id,
        action="integration.create",
        target_type="integration",
        target_id=integration.id,
        metadata={"type": integration.type},
    )
    db.commit()
    db.refresh(integration)
    return _safe_integration(integration)


@router.patch("/{integration_id}", response_model=IntegrationOut)
def update_integration(
    integration_id: str,
    payload: IntegrationPatch,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
) -> IntegrationOut:
    integration = db.scalar(
        select(Integration).where(
            Integration.id == integration_id,
            Integration.tenant_id == user.tenant_id,
        )
    )
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    if payload.status is not None:
        integration.status = payload.status
    if payload.config_json is not None:
        integration.config_json = payload.config_json

    write_audit(
        db,
        tenant_id=user.tenant_id,
        actor_user_id=user.id,
        action="integration.update",
        target_type="integration",
        target_id=integration.id,
        metadata={"type": integration.type},
    )
    db.commit()
    db.refresh(integration)
    return _safe_integration(integration)
