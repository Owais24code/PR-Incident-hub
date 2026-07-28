from fastapi import HTTPException, status

from app.models import Incident


def assert_ticket_creation_allowed(incident: Incident) -> None:
    if incident.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Incident must be approved before creating a Jira ticket",
        )

    if not incident.summary:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Incident must be analyzed before creating a Jira ticket",
        )

