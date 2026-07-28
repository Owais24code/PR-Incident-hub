import json

import boto3
from botocore.client import Config
from botocore.exceptions import BotoCoreError, ClientError

from app.config import settings


def _client():
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url,
        aws_access_key_id=settings.s3_access_key_id,
        aws_secret_access_key=settings.s3_secret_access_key,
        region_name=settings.s3_region,
        config=Config(s3={"addressing_style": "path" if settings.s3_force_path_style else "auto"}),
    )


def ensure_bucket() -> None:
    client = _client()
    buckets = client.list_buckets().get("Buckets", [])
    if not any(bucket["Name"] == settings.s3_bucket for bucket in buckets):
        client.create_bucket(Bucket=settings.s3_bucket)


def put_json(key: str, payload: dict) -> str:
    client = _client()
    try:
        ensure_bucket()
        client.put_object(
            Bucket=settings.s3_bucket,
            Key=key,
            Body=json.dumps(payload, indent=2, default=str).encode("utf-8"),
            ContentType="application/json",
        )
        return key
    except (BotoCoreError, ClientError):
        # Object storage should never prevent ingestion; the JSON copy remains in Postgres.
        return ""
