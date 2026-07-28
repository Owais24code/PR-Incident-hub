import hashlib
import hmac

import pytest
from fastapi import HTTPException

from app.security import verify_github_signature


def test_github_signature_rejects_invalid_hmac(monkeypatch):
    monkeypatch.setattr("app.security.settings.github_webhook_secret", "secret")

    with pytest.raises(HTTPException):
        verify_github_signature(b"{}", "sha256=bad")


def test_github_signature_allows_local_without_secret(monkeypatch):
    monkeypatch.setattr("app.security.settings.github_webhook_secret", None)
    monkeypatch.setattr("app.security.settings.app_env", "local")

    verify_github_signature(b"{}", None)


def test_github_signature_exact_digest(monkeypatch):
    monkeypatch.setattr("app.security.settings.github_webhook_secret", "secret")
    body = b'{"repository":{"full_name":"acme/api"}}'
    digest = hmac.new(b"secret", body, hashlib.sha256).hexdigest()

    verify_github_signature(body, f"sha256={digest}")

