import calendar
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel, EmailStr, Field
from pymongo import ReturnDocument

from config import settings
from database import get_db
from dependencies.auth import get_current_user
from models.transaction import RecordCreateLegacy
from routers.auth import clear_token_cookie, set_token_cookie
from utils.jwt import create_access_token
from utils.password import hash_password
from utils.serialization import serialize_document, serialize_user

router = APIRouter()


def display_role(role: str) -> str:
    m = {"viewer": "Viewer", "analyst": "Analyst", "admin": "Admin"}
    return m.get(str(role).lower(), role or "Viewer")


async def find_user_by_username(db: Any, raw: str) -> Any:
    """Match users collection by username or name (exact, then case-insensitive)."""
    u = (raw or "").strip()
    if not u:
        return None
    coll = db[settings.users_collection]
    doc = await coll.find_one({"username": u})
    if doc:
        return doc
    doc = await coll.find_one({"name": u})
    if doc:
        return doc
    doc = await coll.find_one(
        {"username": {"$regex": f"^{re.escape(u)}$", "$options": "i"}},
    )
    if doc:
        return doc
    return await coll.find_one(
        {"name": {"$regex": f"^{re.escape(u)}$", "$options": "i"}},
    )


@router.get("/logout")
async def logout_get(response: Response):
    clear_token_cookie(response)
    return {"message": "Logout successful", "success": True}


@router.get("/dashboard")
async def dashboard_legacy(current: Dict[str, Any] = Depends(get_current_user)):
    db = get_db()
    coll = db[settings.transactions_collection]
    role_key = str(current["role"]).lower()
    user_oid = ObjectId(current["id"])
    match: Dict[str, Any] = (
        {"userId": user_oid} if role_key == "viewer" else {}
    )

    pipeline_income = [
        {"$match": {**match, "type": "income"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]
    pipeline_expense = [
        {"$match": {**match, "type": "expense"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]
    inc = await coll.aggregate(pipeline_income).to_list(1)
    exp = await coll.aggregate(pipeline_expense).to_list(1)
    total_income = float(inc[0]["total"]) if inc else 0.0
    total_expense = float(exp[0]["total"]) if exp else 0.0
    net_balance = total_income - total_expense

    recent_pipeline = [
        {"$match": match},
        {"$sort": {"createdAt": -1}},
        {"$limit": 5},
        {
            "$lookup": {
                "from": settings.users_collection,
                "localField": "userId",
                "foreignField": "_id",
                "as": "user",
            }
        },
        {"$unwind": {"path": "$user", "preserveNullAndEmptyArrays": True}},
        {
            "$project": {
                "_id": 1,
                "category": 1,
                "amount": 1,
                "type": 1,
                "createdAt": 1,
                "username": {"$ifNull": ["$user.username", "$user.name"]},
            }
        },
    ]
    recent = await coll.aggregate(recent_pipeline).to_list(30)
    for r in recent:
        if "user" in r:
            del r["user"]
        if not r.get("username"):
            u = await db[settings.users_collection].find_one(
                {"_id": r.get("userId")},
            )
            if u:
                r["username"] = u.get("name") or u.get("username") or ""
    recent = [
        serialize_document(r, legacy_id=True) or {}
        for r in recent
    ]

    data: Dict[str, Any] = {
        "totalIncome": total_income,
        "totalExpense": total_expense,
        "netBalance": net_balance,
        "recent": recent,
    }

    if role_key in ("analyst", "admin"):
        categories = await coll.aggregate(
            [
                {"$match": {**match, "type": "expense"}},
                {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}},
            ],
        ).to_list(200)

        trends_raw = await coll.aggregate(
            [
                {"$match": match},
                {
                    "$project": {
                        "amount": 1,
                        "type": 1,
                        "month": {
                            "$month": {
                                "$ifNull": ["$date", "$createdAt"],
                            },
                        },
                        "year": {
                            "$year": {
                                "$ifNull": ["$date", "$createdAt"],
                            },
                        },
                    }
                },
                {
                    "$group": {
                        "_id": {"year": "$year", "month": "$month"},
                        "income": {
                            "$sum": {
                                "$cond": [
                                    {"$eq": ["$type", "income"]},
                                    "$amount",
                                    0,
                                ],
                            },
                        },
                        "expense": {
                            "$sum": {
                                "$cond": [
                                    {"$eq": ["$type", "expense"]},
                                    "$amount",
                                    0,
                                ],
                            },
                        },
                    }
                },
                {"$sort": {"_id.year": 1, "_id.month": 1}},
            ],
        ).to_list(500)

        trends: List[Dict[str, Any]] = []
        for t in trends_raw:
            mid = t["_id"]["month"]
            yid = t["_id"]["year"]
            label = f"{calendar.month_abbr[mid]} {yid}"
            trends.append(
                {
                    "month": label,
                    "income": t["income"],
                    "expense": t["expense"],
                },
            )
        if len(trends) == 0:
            trends = [{"month": "Start", "income": 0, "expense": 0}]
        elif len(trends) == 1:
            trends = [{"month": "Start", "income": 0, "expense": 0}, *trends]

        data = {
            **data,
            "categories": categories,
            "trends": trends,
        }

    if role_key == "admin":
        users_data = await coll.aggregate(
            [
                {
                    "$lookup": {
                        "from": settings.users_collection,
                        "localField": "userId",
                        "foreignField": "_id",
                        "as": "user",
                    }
                },
                {"$unwind": "$user"},
                {
                    "$group": {
                        "_id": "$user.username",
                        "totalIncome": {
                            "$sum": {
                                "$cond": [
                                    {"$eq": ["$type", "income"]},
                                    "$amount",
                                    0,
                                ],
                            },
                        },
                        "totalExpense": {
                            "$sum": {
                                "$cond": [
                                    {"$eq": ["$type", "expense"]},
                                    "$amount",
                                    0,
                                ],
                            },
                        },
                    }
                },
            ],
        ).to_list(500)
        data["usersData"] = users_data

    role_out = display_role(current["doc"].get("role", current["role"]))
    return {"success": True, "role": role_out, "data": data}


@router.get("/records")
async def records_list(
    search: Optional[str] = Query(None),
    type: Optional[str] = Query(None),  # noqa: A002
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current: Dict[str, Any] = Depends(get_current_user),
):
    db = get_db()
    coll = db[settings.transactions_collection]
    role_key = str(current["role"]).lower()
    match: Dict[str, Any] = {}
    if role_key == "viewer":
        match["userId"] = ObjectId(current["id"])
    if type:
        match["type"] = type
    if category:
        match["category"] = category
    if search:
        match["$or"] = [
            {"category": {"$regex": search, "$options": "i"}},
            {"note": {"$regex": search, "$options": "i"}},
        ]

    skip = (page - 1) * limit
    pipeline = [
        {"$match": match},
        {"$sort": {"createdAt": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {
            "$lookup": {
                "from": settings.users_collection,
                "localField": "userId",
                "foreignField": "_id",
                "as": "user",
            }
        },
        {"$unwind": {"path": "$user", "preserveNullAndEmptyArrays": True}},
        {
            "$project": {
                "_id": 1,
                "amount": 1,
                "type": 1,
                "category": 1,
                "date": 1,
                "note": 1,
                "username": {"$ifNull": ["$user.username", "$user.name"]},
            }
        },
    ]
    records = await coll.aggregate(pipeline).to_list(limit)
    for r in records:
        if not r.get("username"):
            u = await db[settings.users_collection].find_one(
                {"_id": r.get("userId")},
            )
            if u:
                r["username"] = u.get("name") or u.get("username") or ""
    records = [
        serialize_document(r, legacy_id=True) or {}
        for r in records
    ]

    total = await coll.count_documents(match)
    role_out = display_role(current["doc"].get("role", current["role"]))
    return {
        "success": True,
        "role": role_out,
        "data": records,
        "pagination": {
            "total": total,
            "page": page,
            "pages": max(1, (total + limit - 1) // limit),
        },
    }


@router.post("/records/add")
async def records_add(
    body: RecordCreateLegacy,
    current: Dict[str, Any] = Depends(get_current_user),
):
    db = get_db()
    owner = await find_user_by_username(db, body.username)
    if not owner:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "No user found with this username. Use a name that exists in the database.",
            },
        )

    role_key = str(current["role"]).lower()
    if role_key != "admin" and str(owner["_id"]) != current["id"]:
        raise HTTPException(
            status_code=403,
            detail={
                "message": "You can only add records for your own username.",
            },
        )

    now = datetime.now(timezone.utc)
    doc = {
        "userId": owner["_id"],
        "amount": float(body.amount),
        "type": body.type,
        "date": now,
        "category": body.category,
        "note": body.note or "",
        "createdAt": now,
        "updatedAt": now,
    }
    await db[settings.transactions_collection].insert_one(doc)
    return {"message": "Record saved successfully"}


@router.put("/records/{rec_id}")
async def records_put(
    rec_id: str,
    body: Dict[str, Any],
    current: Dict[str, Any] = Depends(get_current_user),
):
    if str(current["role"]).lower() != "admin":
        raise HTTPException(status_code=403, detail={"message": "Forbidden"})
    try:
        oid = ObjectId(rec_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail={"message": "Invalid ID"})
    patch = {
        k: body[k]
        for k in ("category", "amount", "note")
        if k in body
    }
    patch["updatedAt"] = datetime.now(timezone.utc)
    db = get_db()
    updated = await db[settings.transactions_collection].find_one_and_update(
        {"_id": oid},
        {"$set": patch},
        return_document=ReturnDocument.AFTER,
    )
    if not updated:
        raise HTTPException(status_code=404, detail={"message": "Not found"})
    return {"success": True, "data": serialize_document(updated, legacy_id=True)}


@router.delete("/records/{rec_id}")
async def records_delete(
    rec_id: str,
    current: Dict[str, Any] = Depends(get_current_user),
):
    if str(current["role"]).lower() != "admin":
        raise HTTPException(status_code=403, detail={"message": "Forbidden"})
    try:
        oid = ObjectId(rec_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail={"message": "Invalid ID"})
    db = get_db()
    res = await db[settings.transactions_collection].delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail={"message": "Not found"})
    return {"success": True}


class SeedAdminBody(BaseModel):
    secret: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(default="Admin")


@router.post("/auth/seed-admin")
async def seed_admin(response: Response, body: SeedAdminBody):
    if not settings.seed_admin_key or body.secret != settings.seed_admin_key:
        raise HTTPException(status_code=404, detail={"message": "Not found"})
    db = get_db()
    coll = db[settings.users_collection]
    now = datetime.now(timezone.utc)
    em = body.email.lower().strip()
    existing = await coll.find_one({"email": em})
    if existing:
        await coll.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "role": "admin",
                    "password": hash_password(body.password),
                    "updatedAt": now,
                },
            },
        )
        uid = str(existing["_id"])
    else:
        ins = await coll.insert_one(
            {
                "name": body.name,
                "username": body.name,
                "email": em,
                "password": hash_password(body.password),
                "role": "admin",
                "isActive": True,
                "createdAt": now,
                "updatedAt": now,
            },
        )
        uid = str(ins.inserted_id)
    user = await coll.find_one({"_id": ObjectId(uid)})
    token = create_access_token(
        user_id=uid,
        email=user["email"],
        role="admin",
    )
    set_token_cookie(response, token)
    return {"message": "Admin seeded", "user": serialize_user(user)}
