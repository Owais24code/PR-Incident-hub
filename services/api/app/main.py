from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.dependencies import get_current_user
from app.models import User
from app.routers import audit_logs, auth, incidents, integrations, webhooks
from app.schemas import UserOut

app = FastAPI(title="Security PR Copilot API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(webhooks.router)
app.include_router(incidents.router)
app.include_router(integrations.router)
app.include_router(audit_logs.router)


@app.get("/healthz")
def healthz() -> dict:
    return {"status": "ok", "service": "security-pr-copilot-api"}


@app.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> User:
    return user
