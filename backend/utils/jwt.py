from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from jose import JWTError, jwt

from config import settings


def create_access_token(*, user_id: str, email: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(hours=settings.jwt_expiry_hours)
    payload: Dict[str, Any] = {
        "id": user_id,
        "userId": user_id,
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(
        payload,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def decode_token(token: str) -> Dict[str, Any]:
    return jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
    )
