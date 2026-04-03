from typing import Any, Callable, Dict

from fastapi import Depends, HTTPException

from dependencies.auth import get_current_user


def require_roles(*allowed_roles: str) -> Callable[..., Dict[str, Any]]:
    allowed = {r.lower() for r in allowed_roles}

    async def dependency(
        current_user: Dict[str, Any] = Depends(get_current_user),
    ) -> Dict[str, Any]:
        role = str(current_user.get("role", "")).lower()
        if role not in allowed:
            raise HTTPException(
                status_code=403,
                detail={
                    "message": (
                        f"Access denied. Required role: {sorted(allowed)}"
                    ),
                },
            )
        return current_user

    return dependency
