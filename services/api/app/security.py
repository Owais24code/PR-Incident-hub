import hashlib
import hmac
import time
from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError, VerifyMismatchError
from fastapi import HTTPException, Request, status

from app.config import settings

password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return password_hasher.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError):
        return False


def create_access_token(user_id: str, tenant_id: str, role: str) -> str:
    now = datetime.now(UTC)
    payload = {
        "iss": settings.jwt_issuer,
        "sub": user_id,
        "tenant_id": tenant_id,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.access_token_expire_minutes)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"], issuer=settings.jwt_issuer)
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token"
        ) from exc


async def verify_slack_signature(request: Request, raw_body: bytes) -> None:
    if not settings.slack_signing_secret:
        if settings.app_env == "local":
            return
        raise HTTPException(status_code=500, detail="Slack signing secret is not configured")

    timestamp = request.headers.get("X-Slack-Request-Timestamp")
    signature = request.headers.get("X-Slack-Signature")
    if not timestamp or not signature:
        raise HTTPException(status_code=401, detail="Missing Slack signature")

    if abs(time.time() - int(timestamp)) > 60 * 5:
        raise HTTPException(status_code=401, detail="Stale Slack request")

    basestring = b"v0:" + timestamp.encode() + b":" + raw_body
    digest = hmac.new(settings.slack_signing_secret.encode(), basestring, hashlib.sha256).hexdigest()
    expected = f"v0={digest}"
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=401, detail="Invalid Slack signature")


def verify_github_signature(raw_body: bytes, signature: str | None) -> None:
    if not settings.github_webhook_secret:
        if settings.app_env == "local":
            return
        raise HTTPException(status_code=500, detail="GitHub webhook secret is not configured")

    if not signature or not signature.startswith("sha256="):
        raise HTTPException(status_code=401, detail="Missing GitHub signature")

    digest = hmac.new(settings.github_webhook_secret.encode(), raw_body, hashlib.sha256).hexdigest()
    expected = f"sha256={digest}"
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=401, detail="Invalid GitHub signature")
