import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Incident, IncidentEvidence


def extract_repo_full_name(payload: dict) -> str | None:
    repo = payload.get("repository") or {}
    return repo.get("full_name")


def extract_commit_sha(payload: dict) -> str | None:
    if payload.get("after"):
        return payload["after"]
    if payload.get("check_suite", {}).get("head_sha"):
        return payload["check_suite"]["head_sha"]
    if payload.get("alert", {}).get("fixed_in"):
        fixed = payload["alert"]["fixed_in"]
        if isinstance(fixed, list) and fixed:
            return fixed[0]
    return None


def enrich_incident_from_github(db: Session, incident: Incident) -> list[IncidentEvidence]:
    payload = incident.alert.raw_payload_json
    repo = extract_repo_full_name(payload)
    sha = extract_commit_sha(payload)

    evidence: list[IncidentEvidence] = []
    if not repo:
        return evidence

    headers = {"Accept": "application/vnd.github+json"}
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"

    with httpx.Client(timeout=15) as client:
        repo_response = client.get(f"https://api.github.com/repos/{repo}", headers=headers)
        repo_data = repo_response.json() if repo_response.status_code < 400 else {"error": repo_response.text}
        evidence.append(
            IncidentEvidence(
                incident_id=incident.id,
                evidence_type="repository",
                source="github",
                reference_id=repo,
                content_json=repo_data,
            )
        )

        if sha:
            commit_response = client.get(f"https://api.github.com/repos/{repo}/commits/{sha}", headers=headers)
            commit_data = (
                commit_response.json() if commit_response.status_code < 400 else {"error": commit_response.text}
            )
            evidence.append(
                IncidentEvidence(
                    incident_id=incident.id,
                    evidence_type="commit",
                    source="github",
                    reference_id=sha,
                    content_json=commit_data,
                )
            )

    db.add_all(evidence)
    db.flush()
    return evidence

