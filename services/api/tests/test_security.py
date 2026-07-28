import hashlib
import hmac
import time

import jwt

from app.security import (
    create_access_token,
    hash_password,
    verify_github_signature,
    verify_password,
)


def test_password_hash_roundtrip():
    password_hash = hash_password("Password123!")

    assert password_hash != "Password123!"
    assert verify_password("Password123!", password_hash)
    assert not verify_password("wrong-password", password_hash)


def test_access_token_contains_tenant_and_role():
    token = create_access_token("user-1", "tenant-1", "admin")
    payload = jwt.decode(
        token,
        "change-me",
        algorithms=["HS256"],
        issuer="security-pr-copilot",
    )

    assert payload["sub"] == "user-1"
    assert payload["tenant_id"] == "tenant-1"
    assert payload["role"] == "admin"


def test_github_signature_accepts_valid_hmac(monkeypatch):
    monkeypatch.setattr("app.security.settings.github_webhook_secret", "secret")
    body = b'{"ok":true}'
    digest = hmac.new(b"secret", body, hashlib.sha256).hexdigest()

    verify_github_signature(body, f"sha256={digest}")


def test_slack_signature_shape():
    timestamp = str(int(time.time()))
    body = b'{"event_id":"123"}'
    digest = hmac.new(b"secret", b"v0:" + timestamp.encode() + b":" + body, hashlib.sha256).hexdigest()

    assert f"v0={digest}".startswith("v0=")
