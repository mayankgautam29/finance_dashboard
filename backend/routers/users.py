from datetime import datetime, timezone
from typing import Any, Dict, List

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException

from config import settings
from database import get_db
from dependencies.roles import require_roles
from models.user import UserUpdate
from utils.serialization import serialize_user

router = APIRouter()

VALID_ROLES = frozenset({"viewer", "analyst", "admin"})


def _normalize_role(role: str) -> str:
    r = role.strip().lower()
    if r not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail={"message": "role must be viewer, analyst, or admin"},
        )
    return r


@router.get("")
async def list_users(
    admin: Dict[str, Any] = Depends(require_roles("admin")),
):
    db = get_db()
    out: List[Dict[str, Any]] = []
    async for doc in db[settings.users_collection].find():
        out.append(serialize_user(doc))
    return {"success": True, "data": out}


@router.get("/{user_id}")
async def get_user(
    user_id: str,
    admin: Dict[str, Any] = Depends(require_roles("admin")),
):
    db = get_db()
    try:
        oid = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail={"message": "Not found"})
    doc = await db[settings.users_collection].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail={"message": "Not found"})
    return serialize_user(doc)


@router.put("/{user_id}")
async def update_user(
    user_id: str,
    body: UserUpdate,
    admin: Dict[str, Any] = Depends(require_roles("admin")),
):
    db = get_db()
    try:
        oid = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail={"message": "Not found"})

    patch: Dict[str, Any] = {"updatedAt": datetime.now(timezone.utc)}
    if body.name is not None:
        patch["name"] = body.name.strip()
        patch["username"] = patch["name"]
    if body.email is not None:
        patch["email"] = body.email.lower().strip()
        taken = await db[settings.users_collection].find_one(
            {"email": patch["email"], "_id": {"$ne": oid}},
        )
        if taken:
            raise HTTPException(
                status_code=400,
                detail={"message": "Email already registered"},
            )
    if body.role is not None:
        new_role = _normalize_role(body.role)
        if str(admin["id"]) == user_id and new_role != "admin":
            raise HTTPException(
                status_code=400,
                detail={"message": "Admin cannot demote their own account"},
            )
        patch["role"] = new_role

    if body.isActive is not None:
        patch["isActive"] = body.isActive

    result = await db[settings.users_collection].update_one(
        {"_id": oid},
        {"$set": patch},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail={"message": "Not found"})
    updated = await db[settings.users_collection].find_one({"_id": oid})
    return {"success": True, "data": serialize_user(updated)}


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    admin: Dict[str, Any] = Depends(require_roles("admin")),
):
    if str(admin["id"]) == user_id:
        raise HTTPException(
            status_code=400,
            detail={"message": "Admin cannot delete their own account"},
        )
    db = get_db()
    try:
        oid = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail={"message": "Not found"})

    res = await db[settings.users_collection].delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail={"message": "Not found"})
    await db[settings.transactions_collection].delete_many({"userId": oid})
    return {"message": "User deleted"}
