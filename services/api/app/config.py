from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "local"
    jwt_secret: str = Field(default="change-me")
    jwt_issuer: str = "security-pr-copilot"
    access_token_expire_minutes: int = 120
    api_cors_origins: str = "http://localhost:3000"

    database_url: str = "postgresql+psycopg://copilot:copilot@localhost:5432/security_pr_copilot"
    redis_url: str = "redis://localhost:6379/0"

    s3_endpoint_url: str = "http://localhost:9000"
    s3_access_key_id: str = "minioadmin"
    s3_secret_access_key: str = "minioadmin"
    s3_bucket: str = "incident-evidence"
    s3_region: str = "us-east-1"
    s3_force_path_style: bool = True

    openai_api_key: str | None = None
    openai_model: str = "gpt-4.1-mini"

    slack_signing_secret: str | None = None
    github_webhook_secret: str | None = None
    github_token: str | None = None

    jira_base_url: str | None = None
    jira_email: str | None = None
    jira_api_token: str | None = None
    jira_project_key: str = "SEC"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.api_cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
