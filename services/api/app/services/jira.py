import httpx
from fastapi import HTTPException, status

from app.config import settings
from app.models import Incident


def create_jira_ticket(incident: Incident) -> dict:
    missing = [
        name
        for name, value in {
            "JIRA_BASE_URL": settings.jira_base_url,
            "JIRA_EMAIL": settings.jira_email,
            "JIRA_API_TOKEN": settings.jira_api_token,
            "JIRA_PROJECT_KEY": settings.jira_project_key,
        }.items()
        if not value
    ]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Jira is not configured: {', '.join(missing)}",
        )

    latest_recommendation = incident.recommendations[-1] if incident.recommendations else None
    description = {
        "type": "doc",
        "version": 1,
        "content": [
            {
                "type": "paragraph",
                "content": [{"type": "text", "text": incident.summary or incident.alert.title}],
            },
            {
                "type": "paragraph",
                "content": [
                    {
                        "type": "text",
                        "text": f"Recommendation: {latest_recommendation.recommendation_text if latest_recommendation else 'Review alert evidence.'}",
                    }
                ],
            },
        ],
    }

    payload = {
        "fields": {
            "project": {"key": settings.jira_project_key},
            "summary": f"[Security] {incident.alert.title}",
            "description": description,
            "issuetype": {"name": "Task"},
            "labels": ["security-pr-copilot", incident.severity],
        }
    }

    with httpx.Client(timeout=20) as client:
        response = client.post(
            f"{settings.jira_base_url.rstrip('/')}/rest/api/3/issue",
            auth=(settings.jira_email, settings.jira_api_token),
            headers={"Accept": "application/json", "Content-Type": "application/json"},
            json=payload,
        )

    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"Jira ticket creation failed: {response.text}")

    data = response.json()
    key = data["key"]
    return {
        "external_ticket_id": key,
        "external_url": f"{settings.jira_base_url.rstrip('/')}/browse/{key}",
        "status": "created",
    }

