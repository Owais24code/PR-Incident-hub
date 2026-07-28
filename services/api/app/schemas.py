from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class TenantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    plan: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    email: EmailStr
    name: str
    role: str


class RegisterIn(BaseModel):
    tenant_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    name: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=10, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class AuthOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class IntegrationIn(BaseModel):
    type: Literal["slack", "github", "jira", "openai"]
    status: str = "configured"
    config_json: dict[str, Any] = Field(default_factory=dict)


class IntegrationPatch(BaseModel):
    status: str | None = None
    config_json: dict[str, Any] | None = None


class IntegrationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    type: str
    status: str
    config_json: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    source_type: str
    source_event_id: str
    severity: str
    title: str
    raw_payload_json: dict[str, Any]
    raw_payload_object_key: str | None
    created_at: datetime


class EvidenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    evidence_type: str
    source: str
    reference_id: str | None
    content_json: dict[str, Any]
    object_key: str | None
    created_at: datetime


class RecommendationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    recommendation_text: str
    confidence: float
    requires_approval: bool
    severity_rationale: str | None
    created_at: datetime


class TicketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    external_system: str
    external_ticket_id: str
    external_url: str | None
    status: str
    created_at: datetime


class IncidentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    alert_id: str
    summary: str | None
    risk_score: int
    severity: str
    status: str
    owner_user_id: str | None
    owner_suggestion: str | None
    created_at: datetime
    updated_at: datetime


class IncidentDetailOut(IncidentOut):
    alert: AlertOut
    evidence: list[EvidenceOut]
    recommendations: list[RecommendationOut]
    tickets: list[TicketOut]


class JobOut(BaseModel):
    job_id: str
    status: str


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    actor_user_id: str | None
    action: str
    target_type: str
    target_id: str
    metadata_json: dict[str, Any]
    created_at: datetime


class IncidentAnalysis(BaseModel):
    summary: str
    risk_score: int = Field(ge=0, le=100)
    severity: Literal["unknown", "low", "medium", "high", "critical"]
    owner_suggestion: str
    recommendation_text: str
    confidence: float = Field(ge=0, le=1)
    severity_rationale: str

