import re
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr, Field, model_validator

from config import settings
from database import get_db
from dependencies.auth import get_current_user
from models.user import UserLogin
from utils.jwt import create_access_token
from utils.password import hash_password, verify_password
from utils.serialization import serialize_user

router = APIRouter()

_SIGNUP_ROLES = frozenset({"viewer", "analyst", "admin"})


def _normalize_signup_role(role: str | None) -> str:
    if not role or not str(role).strip():
        return "viewer"
    r = str(role).strip().lower()
    return r if r in _SIGNUP_ROLES else "viewer"


def set_token_cookie(response: Response, token: str) -> None:
    max_age = int(settings.jwt_expiry_hours * 3600)
    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        max_age=max_age,
        samesite="lax",
        secure=settings.secure_cookies,
        path="/",
    )


def clear_token_cookie(response: Response) -> None:
    response.set_cookie(
        key="token",
        value="",
        httponly=True,
        max_age=0,
        samesite="lax",
        secure=settings.secure_cookies,
        path="/",
        expires=0,
    )


class SignupBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str | None = None
    username: str | None = None
    role: str | None = None

    @model_validator(mode="after")
    def resolve_name(self):  # noqa: N802
        n = self.name or self.username
        if not n or len(str(n).strip()) < 1:
            raise ValueError("name or username is required")
        self.name = str(n).strip()
        return self


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(body: SignupBody, response: Response):
    db = get_db()
    coll = db[settings.users_collection]

    raw = body.email.strip()
    existing = await coll.find_one({"email": raw.lower()})
    if not existing:
        existing = await coll.find_one(
            {
                "email": {
                    "$regex": f"^{re.escape(raw)}$",
                    "$options": "i",
                },
            },
        )
    if existing:
        raise HTTPException(
            status_code=400,
            detail={"message": "Email already registered"},
        )

    now = datetime.now(timezone.utc)
    chosen_role = _normalize_signup_role(body.role)
    doc = {
        "name": body.name,
        "username": body.name,
        "email": body.email.lower().strip(),
        "password": hash_password(body.password),
        "role": chosen_role,
        "createdAt": now,
        "updatedAt": now,
        "isActive": True,
    }
    ins = await coll.insert_one(doc)
    uid = str(ins.inserted_id)
    token = create_access_token(
        user_id=uid,
        email=doc["email"],
        role=chosen_role,
    )
    set_token_cookie(response, token)

    created = await coll.find_one({"_id": ins.inserted_id})
    return {
        "message": "User created successfully",
        "user": serialize_user(created),
    }


@router.post("/login")
async def login(body: UserLogin, response: Response):
    db = get_db()
    coll = db[settings.users_collection]
    raw_email = body.email.strip()
    # Exact match (new signups store lowercase)
    user = await coll.find_one({"email": raw_email.lower()})
    if not user:
        # Legacy Next/Mongoose users often have mixed-case email in DB
        user = await coll.find_one(
            {
                "email": {
                    "$regex": f"^{re.escape(raw_email)}$",
                    "$options": "i",
                },
            },
        )
    stored_hash = user.get("password") if user else None
    if isinstance(stored_hash, bytes):
        stored_hash = stored_hash.decode("utf-8")
    if not user or not stored_hash or not verify_password(
        body.password, stored_hash
    ):
        raise HTTPException(
            status_code=401,
            detail={"message": "Invalid credentials"},
        )

    if user.get("isActive") is False:
        raise HTTPException(
            status_code=401,
            detail={"message": "Invalid credentials"},
        )

    role = str(user.get("role", "viewer")).lower()
    token = create_access_token(
        user_id=str(user["_id"]),
        email=user["email"],
        role=role,
    )
    set_token_cookie(response, token)
    return {"message": "Login successful", "success": True}


@router.post("/logout")
async def logout_post(response: Response):
    clear_token_cookie(response)
    return {"message": "Logged out"}


@router.get("/me")
async def me(current: Dict[str, Any] = Depends(get_current_user)):
    return serialize_user(current["doc"])


@router.get("/session")
async def session(request: Request):
    from jose import JWTError

    from utils.jwt import decode_token

    token = request.cookies.get("token")
    if not token:
        return {"loggedIn": False, "role": None}
    try:
        payload = decode_token(token)
        role = payload.get("role")
        return {"loggedIn": True, "role": role}
    except JWTError:
        return {"loggedIn": False, "role": None}
