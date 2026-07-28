import json

from fastapi import HTTPException, status
from openai import OpenAI

from app.config import settings
from app.models import Incident
from app.schemas import IncidentAnalysis

SYSTEM_PROMPT = """You are Security PR Copilot for a B2B SaaS engineering team.
Translate security alerts into developer-ready incident work.
Be specific, avoid alarmism, and do not claim that remediation has already happened.
Ticket/PR actions require human approval."""


def _incident_context(incident: Incident) -> dict:
    return {
        "incident": {
            "id": incident.id,
            "status": incident.status,
            "current_severity": incident.severity,
            "current_risk_score": incident.risk_score,
        },
        "alert": {
            "source_type": incident.alert.source_type,
            "source_event_id": incident.alert.source_event_id,
            "severity": incident.alert.severity,
            "title": incident.alert.title,
            "payload": incident.alert.raw_payload_json,
        },
        "evidence": [
            {
                "type": evidence.evidence_type,
                "source": evidence.source,
                "reference_id": evidence.reference_id,
                "content": evidence.content_json,
            }
            for evidence in incident.evidence
        ],
    }


def generate_incident_analysis(incident: Incident) -> IncidentAnalysis:
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OPENAI_API_KEY is required for incident analysis",
        )

    client = OpenAI(api_key=settings.openai_api_key)
    response = client.responses.parse(
        model=settings.openai_model,
        input=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    "Analyze this security alert and return a strict structured response. "
                    "Owner suggestion can be a team, username, repo maintainer hint, or unknown.\n\n"
                    + json.dumps(_incident_context(incident), default=str)
                ),
            },
        ],
        text_format=IncidentAnalysis,
    )
    return response.output_parsed
