import pytest
from fastapi import HTTPException

from app.models import Alert, Incident
from app.services.policy import assert_ticket_creation_allowed


def test_ticket_creation_requires_approval():
    incident = Incident(
        tenant_id="tenant-1",
        alert=Alert(
            tenant_id="tenant-1",
            source_type="slack",
            source_event_id="evt",
            severity="high",
            title="Alert",
            raw_payload_json={},
        ),
        status="summarized",
        summary="Summary",
    )

    with pytest.raises(HTTPException):
        assert_ticket_creation_allowed(incident)


def test_ticket_creation_requires_summary():
    incident = Incident(
        tenant_id="tenant-1",
        alert=Alert(
            tenant_id="tenant-1",
            source_type="slack",
            source_event_id="evt",
            severity="high",
            title="Alert",
            raw_payload_json={},
        ),
        status="approved",
        summary=None,
    )

    with pytest.raises(HTTPException):
        assert_ticket_creation_allowed(incident)


def test_ticket_creation_allowed_after_approval_and_summary():
    incident = Incident(
        tenant_id="tenant-1",
        alert=Alert(
            tenant_id="tenant-1",
            source_type="slack",
            source_event_id="evt",
            severity="high",
            title="Alert",
            raw_payload_json={},
        ),
        status="approved",
        summary="Summary",
    )

    assert_ticket_creation_allowed(incident)

