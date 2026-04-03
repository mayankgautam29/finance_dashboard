from typing import Any, Dict

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, Request
from jose import JWTError

from config import settings
from database import get_db
from utils.jwt import decode_token


async def get_current_user(request: Request) -> Dict[str, Any]:
    token = request.cookies.get("token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = decode_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_id = payload.get("userId") or payload.get("id") or payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        oid = ObjectId(str(user_id))
    except InvalidId:
        raise HTTPException(status_code=401, detail="Not authenticated")

    db = get_db()
    doc = await db[settings.users_collection].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=401, detail="Not authenticated")

    role_raw = str(doc.get("role", "viewer")).lower()
    name = doc.get("name") or doc.get("username") or ""

    return {
        "id": str(doc["_id"]),
        "email": doc["email"],
        "role": role_raw,
        "name": name,
        "doc": doc,
    }
