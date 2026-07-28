from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user
from app.models import Tenant, User
from app.schemas import AuthOut, LoginIn, RegisterIn, UserOut
from app.security import create_access_token, hash_password, verify_password
from app.services.audit import write_audit

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthOut, status_code=201)
def register(payload: RegisterIn, db: Session = Depends(get_db)) -> AuthOut:
    existing = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    tenant = Tenant(name=payload.tenant_name, plan="starter")
    db.add(tenant)
    db.flush()

    user = User(
        tenant_id=tenant.id,
        email=payload.email.lower(),
        name=payload.name,
        role="admin",
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.flush()
    write_audit(
        db,
        tenant_id=tenant.id,
        actor_user_id=user.id,
        action="auth.register",
        target_type="tenant",
        target_id=tenant.id,
        metadata={"email": user.email},
    )
    db.commit()

    token = create_access_token(user.id, tenant.id, user.role)
    return AuthOut(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=AuthOut)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> AuthOut:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    write_audit(
        db,
        tenant_id=user.tenant_id,
        actor_user_id=user.id,
        action="auth.login",
        target_type="user",
        target_id=user.id,
    )
    db.commit()

    token = create_access_token(user.id, user.tenant_id, user.role)
    return AuthOut(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> User:
    return user

